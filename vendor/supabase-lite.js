(function () {
  'use strict';
  if (window.supabase && window.supabase.createClient) return;
  function jsonHeaders(key) {
    return { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  }
  function createClient(url, anonKey) {
    const base = String(url || '').replace(/\/+$/, '');
    const key = anonKey || '';
    function table(name) {
      const state = { table: name, select: '*', filters: [] };
      const api = {
        select(cols) { state.select = cols || '*'; return api; },
        eq(col, val) { state.filters.push([col, val]); return api; },
        async maybeSingle() {
          const qs = new URLSearchParams({ select: state.select || '*' });
          state.filters.forEach(([c, v]) => qs.append(c, 'eq.' + v));
          const res = await fetch(base + '/rest/v1/' + encodeURIComponent(state.table) + '?' + qs.toString(), { headers: jsonHeaders(key) });
          if (!res.ok) return { data: null, error: { message: await res.text() } };
          const arr = await res.json().catch(() => []);
          return { data: Array.isArray(arr) ? (arr[0] || null) : arr, error: null };
        },
        async upsert(row, opts) {
          const qs = opts && opts.onConflict ? '?on_conflict=' + encodeURIComponent(opts.onConflict) : '';
          const h = jsonHeaders(key);
          h.Prefer = 'resolution=merge-duplicates,return=representation';
          const res = await fetch(base + '/rest/v1/' + encodeURIComponent(state.table) + qs, { method: 'POST', headers: h, body: JSON.stringify(row) });
          if (!res.ok) return { data: null, error: { message: await res.text() } };
          return { data: await res.json().catch(() => null), error: null };
        }
      };
      return api;
    }
    return {
      from: table,
      channel() { return { on() { return this; }, subscribe() { return { unsubscribe() {} }; } }; },
      storage: { from(bucket) { return {
        async upload(path, file) {
          const res = await fetch(base + '/storage/v1/object/' + encodeURIComponent(bucket) + '/' + path, { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'x-upsert': 'true', 'Content-Type': file?.type || 'application/octet-stream' }, body: file });
          if (!res.ok) return { data: null, error: { message: await res.text() } };
          return { data: await res.json().catch(() => ({ path })), error: null };
        },
        getPublicUrl(path) { return { data: { publicUrl: base + '/storage/v1/object/public/' + encodeURIComponent(bucket) + '/' + path } }; }
      }; } }
    };
  }
  window.supabase = { createClient, version: 'local-lite' };
}());
