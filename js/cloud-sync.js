(function () {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────────────────
  const TABLE     = 'gymbaddies_sync';
  const SYNC_ID   = 'gymbaddies-shared';   // fixed – no user input needed
  const MODEL_VER = 2;
  const DEBOUNCE  = 2500;                  // ms after last write before push

  let _client          = null;
  let _pushTimer       = null;
  let _applyingRemote  = false;
  let _lastPushTs      = 0;

  // ── Supabase client ───────────────────────────────────────────────────────
  function client() {
    if (_client) return _client;
    const cfg = window.GB_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || cfg.url.includes('PASTE_')) return null;
    if (!window.supabase) return null;
    _client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return _client;
  }
  function isConfigured() { return !!client(); }

  // ── Toast helper ─────────────────────────────────────────────────────────
  function toast(msg) {
    const el = document.getElementById('app-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(window.__gbToast);
    window.__gbToast = setTimeout(() => el.classList.remove('show'), 2600);
  }

  // ── Local storage helpers ─────────────────────────────────────────────────
  function lsRead(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function lsWrite(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  // Keys we sync to the cloud
  function isManaged(key) {
    const PREFIXES = ['pinnedPlans_','theme_','trainingLog_','sessions_','prs_','done_','h_','lastWorkoutSummary_'];
    return key === 'users' || key === 'customPlans' || key === 'customExercises' ||
           key === 'theme_default' || PREFIXES.some(p => key.startsWith(p));
  }

  // ── Build payload ─────────────────────────────────────────────────────────
  function buildPayload() {
    const users = lsRead('users', []);
    const perUser = {};
    users.forEach(name => {
      const done = {}, history = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('done_' + name + '_')) done[k] = lsRead(k, true);
        if (k.startsWith('h_')) {
          const entries = lsRead(k, []).filter(e => e && e.user === name);
          if (entries.length) history[k.slice(2)] = entries;
        }
      }
      perUser[name] = {
        pinnedPlans:   lsRead('pinnedPlans_' + name, null),
        theme:         lsRead('theme_' + name, null),
        trainingLog:   lsRead('trainingLog_' + name, []),
        sessions:      lsRead('sessions_' + name, []),
        prs:           lsRead('prs_' + name, []),
        lastSummary:   lsRead('lastWorkoutSummary_' + name, null),
        done, history,
      };
    });
    return {
      version: MODEL_VER, updatedAt: new Date().toISOString(),
      model: {
        global: {
          users, appVersion: 'gb-v3',
          customPlans:     lsRead('customPlans', {}),
          customExercises: lsRead('customExercises', []),
          themeDefault:    lsRead('theme_default', 'dark'),
        },
        users: perUser,
      },
    };
  }

  // ── Apply payload from cloud ──────────────────────────────────────────────
  function clearManaged() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.forEach(k => { if (k && isManaged(k)) localStorage.removeItem(k); });
  }

  function applyPayload(payload) {
    if (!payload || !payload.model) return;
    _applyingRemote = true;
    try {
      const { global: g, users: pu } = payload.model;
      clearManaged();
      lsWrite('users',           Array.isArray(g.users) ? g.users : Object.keys(pu || {}));
      lsWrite('customPlans',     g.customPlans || {});
      lsWrite('customExercises', Array.isArray(g.customExercises) ? g.customExercises : []);
      lsWrite('theme_default',   g.themeDefault || 'dark');

      const allHistory = {};
      Object.keys(pu || {}).forEach(name => {
        const d = pu[name] || {};
        if (Array.isArray(d.pinnedPlans)) lsWrite('pinnedPlans_' + name, d.pinnedPlans);
        if (d.theme)                       lsWrite('theme_' + name, d.theme);
        lsWrite('trainingLog_' + name, Array.isArray(d.trainingLog) ? d.trainingLog : []);
        lsWrite('sessions_'   + name, Array.isArray(d.sessions)    ? d.sessions    : []);
        lsWrite('prs_'        + name, Array.isArray(d.prs)         ? d.prs         : []);
        if (d.lastSummary) lsWrite('lastWorkoutSummary_' + name, d.lastSummary);
        Object.keys(d.done    || {}).forEach(k => lsWrite(k, d.done[k]));
        Object.keys(d.history || {}).forEach(exId => {
          allHistory[exId] = allHistory[exId] || [];
          allHistory[exId].push(...(d.history[exId] || []));
        });
      });
      Object.keys(allHistory).forEach(exId => {
        const sorted = allHistory[exId].sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-200);
        lsWrite('h_' + exId, sorted);
      });
    } finally { _applyingRemote = false; }
  }

  // ── Push / Pull ───────────────────────────────────────────────────────────
  async function push(silent) {
    const sb = client();
    if (!sb) return false;
    try {
      const { error } = await sb.from(TABLE).upsert(
        { sync_id: SYNC_ID, payload: buildPayload(), updated_at: new Date().toISOString() },
        { onConflict: 'sync_id' }
      );
      if (error) throw error;
      _lastPushTs = Date.now();
      if (!silent) toast('☁️ Gespeichert.');
      return true;
    } catch (e) {
      console.warn('[GBSync] push:', e.message);
      return false;
    }
  }

  async function pull(reloadAfter) {
    const sb = client();
    if (!sb) return false;
    try {
      const { data, error } = await sb.from(TABLE)
        .select('payload,updated_at').eq('sync_id', SYNC_ID).maybeSingle();
      if (error) throw error;
      if (!data) return false;
      applyPayload(data.payload);
      if (reloadAfter) setTimeout(() => location.reload(), 500);
      return true;
    } catch (e) {
      console.warn('[GBSync] pull:', e.message);
      return false;
    }
  }

  // ── Auto-push on localStorage writes ──────────────────────────────────────
  function schedulePush() {
    if (_applyingRemote) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => push(true), DEBOUNCE);
  }

  function patchStorage() {
    if (window.__gbPatched) return;
    window.__gbPatched = true;
    const origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      origSet.call(this, k, v);
      if (this === localStorage && isManaged(k)) schedulePush();
    };
    const origDel = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (k) {
      origDel.call(this, k);
      if (this === localStorage && isManaged(k)) schedulePush();
    };
  }

  // ── Image upload to Supabase Storage ──────────────────────────────────────
  async function uploadImage(file, name) {
    const sb = client();
    if (!sb || !file) return null;
    try {
      const ext  = (file.name || 'img').split('.').pop().toLowerCase() || 'jpg';
      const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const path = 'exercises/' + safe + '_' + Date.now() + '.' + ext;
      const { error } = await sb.storage.from('gymbaddies-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = sb.storage.from('gymbaddies-images').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.warn('[GBSync] uploadImage:', e.message);
      return null;
    }
  }

  // ── Realtime subscription ─────────────────────────────────────────────────
  function subscribeRealtime() {
    const sb = client();
    if (!sb) return;
    sb.channel('gb-live')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: TABLE, filter: `sync_id=eq.${SYNC_ID}` },
        async (evt) => {
          const remoteTs = new Date(evt.new?.updated_at || 0).getTime();
          if (remoteTs > _lastPushTs + 3000) {
            await pull(false);
            if (window.GB?.onRemoteSync) window.GB.onRemoteSync();
          }
        })
      .subscribe();
  }

  // ── Status indicator ──────────────────────────────────────────────────────
  function updateStatusDot(ok) {
    document.querySelectorAll('.cloud-dot').forEach(dot => {
      dot.style.background = ok ? 'var(--green)' : 'var(--orange)';
    });
    document.querySelectorAll('#cloud-status-text').forEach(el => {
      el.textContent = ok ? 'Verbunden · Auto-Sync aktiv' : 'Offline · lokal gespeichert';
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    patchStorage();
    if (!isConfigured()) { updateStatusDot(false); return; }
    const pulled = await pull(false);
    if (pulled) {
      updateStatusDot(true);
      if (window.GB?.onRemoteSync) window.GB.onRemoteSync();
    } else {
      // First time: push local data up
      await push(true);
      updateStatusDot(true);
    }
    subscribeRealtime();
    window.addEventListener('online',  () => { push(true); updateStatusDot(true); });
    window.addEventListener('offline', () => updateStatusDot(false));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.GBCloudSync = { push, pull, uploadImage, isConfigured };
}());
