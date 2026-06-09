(function () {
  'use strict';

  const TABLE = 'gymbaddies_sync';
  const SYNC_ID = 'gymbaddies-shared';
  const MODEL_VER = 7;
  const DEBOUNCE = 2500;
  const POLL_MS = 15000;

  let _client = null;
  let _pushTimer = null;
  let _pollTimer = null;
  let _retryTimer = null;
  let _applyingRemote = false;
  let _lastPushTs = 0;
  let _lastRemoteTs = 0;
  let _syncReady = false;

  function client() {
    if (_client) return _client;
    const cfg = window.GB_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || String(cfg.url).includes('PASTE_')) return null;
    if (!window.supabase || !window.supabase.createClient) return null;
    _client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return _client;
  }
  function isConfigured() { return !!client(); }
  function toast(msg) {
    const el = document.getElementById('app-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(window.__gbToast);
    window.__gbToast = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function lsRead(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function lsWrite(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

  function isManaged(key) {
    const prefixes = ['pinnedPlans_', 'theme_', 'trainingLog_', 'sessions_', 'prs_', 'done_', 'h_', 'lastWorkoutSummary_', 'deload_', 'extra_', 'order_', 'skipped_', 'workoutHistory_', 'pendingSwaps_', 'draft_', 'run_'];
    const globals = ['users', 'customPlans', 'customExercises', 'hiddenExercises', 'favoriteExercises', 'exerciseCategories', 'theme_default', 'lang', 'gb_data_model_version', 'gb_app_version', 'restTimerPos'];
    return globals.includes(key) || prefixes.some(p => key.startsWith(p));
  }

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
      const misc = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k === 'workoutHistory_' + name || k === 'pendingSwaps_' + name || k.startsWith('extra_' + name + '_') || k.startsWith('order_' + name + '_') || k.startsWith('skipped_' + name + '_') || k.startsWith('draft_' + name + '_') || k.startsWith('run_' + name + '_')) misc[k] = lsRead(k, null);
      }
      perUser[name] = {
        pinnedPlans: lsRead('pinnedPlans_' + name, null),
        theme: lsRead('theme_' + name, null),
        deload: lsRead('deload_' + name, false),
        trainingLog: lsRead('trainingLog_' + name, []),
        sessions: lsRead('sessions_' + name, []),
        prs: lsRead('prs_' + name, []),
        workoutHistory: lsRead('workoutHistory_' + name, []),
        pendingSwaps: lsRead('pendingSwaps_' + name, []),
        lastSummary: lsRead('lastWorkoutSummary_' + name, null),
        done,
        history,
        misc,
      };
    });
    return {
      version: MODEL_VER,
      updatedAt: new Date().toISOString(),
      model: {
        global: {
          users,
          appVersion: lsRead('gb_app_version', '7.3.16'),
          dataModelVersion: lsRead('gb_data_model_version', MODEL_VER),
          customPlans: lsRead('customPlans', {}),
          customExercises: lsRead('customExercises', []),
          hiddenExercises: lsRead('hiddenExercises', []),
          favoriteExercises: lsRead('favoriteExercises', []),
          exerciseCategories: lsRead('exerciseCategories', {}),
          themeDefault: lsRead('theme_default', 'dark'),
          lang: lsRead('lang', 'de'),
          restTimerPos: lsRead('restTimerPos', null),
        },
        users: perUser,
      },
    };
  }


  function mergeArrays(a,b){ return Array.isArray(b)&&b.length>= (Array.isArray(a)?a.length:0) ? b : (a||[]); }
  function mergePayloads(localPayload, remotePayload){
    if(!remotePayload||!remotePayload.model) return localPayload;
    const merged = JSON.parse(JSON.stringify(remotePayload));
    const lg=(localPayload.model&&localPayload.model.global)||{};
    const rg=(remotePayload.model&&remotePayload.model.global)||{};
    merged.model.global = Object.assign({}, rg, lg);
    merged.model.users = merged.model.users || {};
    const lu=(localPayload.model&&localPayload.model.users)||{};
    const ru=(remotePayload.model&&remotePayload.model.users)||{};
    Object.keys(lu).forEach(name=>{
      const l=lu[name]||{}; const r=ru[name]||{};
      const m=Object.assign({}, r, l);
      ['trainingLog','sessions','prs','workoutHistory','pendingSwaps'].forEach(k=>{
        const arr=[...(r[k]||[]),...(l[k]||[])];
        const map=new Map();
        arr.forEach(x=> map.set(JSON.stringify(x),x));
        m[k]=[...map.values()];
      });
      m.done=Object.assign({}, r.done||{}, l.done||{});
      m.misc=Object.assign({}, r.misc||{}, l.misc||{});
      m.history=Object.assign({}, r.history||{});
      Object.keys(l.history||{}).forEach(ex=>{
        const arr=[...((r.history||{})[ex]||[]),...((l.history||{})[ex]||[])];
        const map=new Map();
        arr.forEach(row=>{ const key=(row&& (row.id || [row.user,row.date,row.exercise||ex,row.ts||''].join('|'))) ; map.set(key,row);});
        m.history[ex]=[...map.values()];
      });
      merged.model.users[name]=m;
    });
    merged.updatedAt=new Date().toISOString();
    return merged;
  }

  function clearManaged() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.forEach(k => { if (k && isManaged(k)) localStorage.removeItem(k); });
  }

  function applyPayload(payload) {
    if (!payload || !payload.model) return false;
    _applyingRemote = true;
    try {
      const g = payload.model.global || {};
      const pu = payload.model.users || {};
      clearManaged();
      lsWrite('users', Array.isArray(g.users) ? g.users : Object.keys(pu));
      lsWrite('customPlans', g.customPlans || {});
      lsWrite('customExercises', Array.isArray(g.customExercises) ? g.customExercises : []);
      lsWrite('hiddenExercises', Array.isArray(g.hiddenExercises) ? g.hiddenExercises : []);
      lsWrite('favoriteExercises', Array.isArray(g.favoriteExercises) ? g.favoriteExercises : []);
      lsWrite('exerciseCategories', g.exerciseCategories || {});
      lsWrite('theme_default', g.themeDefault || 'dark');
      lsWrite('lang', g.lang || 'de');
      if (g.restTimerPos) lsWrite('restTimerPos', g.restTimerPos);
      lsWrite('gb_data_model_version', Number(g.dataModelVersion || payload.version || MODEL_VER));
      if (g.appVersion) lsWrite('gb_app_version', g.appVersion);

      const allHistory = {};
      Object.keys(pu).forEach(name => {
        const d = pu[name] || {};
        if (Array.isArray(d.pinnedPlans)) lsWrite('pinnedPlans_' + name, d.pinnedPlans);
        if (d.theme) lsWrite('theme_' + name, d.theme);
        if (typeof d.deload === 'boolean') lsWrite('deload_' + name, d.deload);
        lsWrite('trainingLog_' + name, Array.isArray(d.trainingLog) ? d.trainingLog : []);
        lsWrite('sessions_' + name, Array.isArray(d.sessions) ? d.sessions : []);
        lsWrite('prs_' + name, Array.isArray(d.prs) ? d.prs : []);
        lsWrite('workoutHistory_' + name, Array.isArray(d.workoutHistory) ? d.workoutHistory : []);
        lsWrite('pendingSwaps_' + name, Array.isArray(d.pendingSwaps) ? d.pendingSwaps : []);
        if (d.lastSummary) lsWrite('lastWorkoutSummary_' + name, d.lastSummary);
        Object.keys(d.misc || {}).forEach(k => { if (isManaged(k)) lsWrite(k, d.misc[k]); });
        Object.keys(d.done || {}).forEach(k => lsWrite(k, d.done[k]));
        Object.keys(d.history || {}).forEach(exId => {
          allHistory[exId] = allHistory[exId] || [];
          allHistory[exId].push(...(d.history[exId] || []));
        });
      });
      Object.keys(allHistory).forEach(exId => {
        const unique = new Map();
        allHistory[exId].forEach(row => {
          const key = [row.user, row.date, row.exercise || exId, row.ts || ''].join('|');
          unique.set(key, row);
        });
        const sorted = [...unique.values()].sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-240);
        lsWrite('h_' + exId, sorted);
      });
      return true;
    } finally {
      _applyingRemote = false;
    }
  }

  async function push(silent) {
    const sb = client();
    if (!sb) return false;
    try {
      const now = new Date().toISOString();
      let payload = buildPayload();
      try { const r = await sb.from(TABLE).select('payload').eq('sync_id', SYNC_ID).maybeSingle(); if(r && r.data && r.data.payload) payload = mergePayloads(payload, r.data.payload); } catch(e){}
      const { error } = await sb.from(TABLE).upsert({ sync_id: SYNC_ID, payload: payload, updated_at: now }, { onConflict: 'sync_id' });
      if (error) throw error;
      _lastPushTs = Date.now();
      _lastRemoteTs = _lastPushTs;
      updateStatusDot(true);
      if (!silent) toast('Cloud-Sync gespeichert.');
      return true;
    } catch (e) {
      console.warn('[GBSync] push:', e && e.message ? e.message : e);
      updateStatusDot(false);
      return false;
    }
  }

  async function pull(reloadAfter, force) {
    const sb = client();
    if (!sb) return false;
    try {
      const { data, error } = await sb.from(TABLE).select('payload,updated_at').eq('sync_id', SYNC_ID).maybeSingle();
      if (error) throw error;
      if (!data || !data.payload) return false;
      const remoteTs = new Date(data.updated_at || data.payload.updatedAt || 0).getTime() || Date.now();
      if (!force && remoteTs <= _lastRemoteTs) return false;
      _lastRemoteTs = remoteTs;
      const changed = applyPayload(data.payload);
      updateStatusDot(true);
      if (changed && reloadAfter) setTimeout(() => location.reload(), 500);
      return changed;
    } catch (e) {
      console.warn('[GBSync] pull:', e && e.message ? e.message : e);
      updateStatusDot(false);
      return false;
    }
  }

  function schedulePush() {
    if (_applyingRemote) return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => push(true), DEBOUNCE);
  }
  function patchStorage() {
    if (window.__gbPatched) return;
    window.__gbPatched = true;
    const origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { origSet.call(this, k, v); if (this === localStorage && isManaged(k)) schedulePush(); };
    const origDel = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (k) { origDel.call(this, k); if (this === localStorage && isManaged(k)) schedulePush(); };
  }

  async function uploadImage(file, name) {
    const sb = client();
    if (!sb || !file) return null;
    try {
      const ext = (file.name || 'img').split('.').pop().toLowerCase() || 'jpg';
      const safe = String(name || 'exercise').replace(/[^a-zA-Z0-9_-]/g, '_');
      const path = 'exercises/' + safe + '_' + Date.now() + '.' + ext;
      const { error } = await sb.storage.from('gymbaddies-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = sb.storage.from('gymbaddies-images').getPublicUrl(path);
      return data && data.publicUrl ? data.publicUrl : null;
    } catch (e) {
      console.warn('[GBSync] uploadImage:', e && e.message ? e.message : e);
      return null;
    }
  }

  function startPolling() {
    clearInterval(_pollTimer);
    _pollTimer = setInterval(async () => {
      const changed = await pull(false, false);
      if (changed && window.GB && window.GB.onRemoteSync) window.GB.onRemoteSync();
    }, POLL_MS);
  }
  function subscribeRealtime() {
    const sb = client();
    if (!sb) return;
    try {
      sb.channel('gb-live')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: TABLE, filter: 'sync_id=eq.' + SYNC_ID }, async (evt) => {
          const remoteTs = new Date((evt.new && evt.new.updated_at) || 0).getTime();
          if (remoteTs && remoteTs <= _lastPushTs + 3000) return;
          const changed = await pull(false, false);
          if (changed && window.GB && window.GB.onRemoteSync) window.GB.onRemoteSync();
        })
        .subscribe();
    } catch (e) { console.warn('[GBSync] realtime:', e && e.message ? e.message : e); }
    startPolling();
  }

  function updateStatusDot(ok) {
    document.querySelectorAll('.cloud-dot').forEach(dot => { dot.style.background = ok ? 'var(--green)' : 'var(--orange)'; });
    document.querySelectorAll('#cloud-status-text').forEach(el => { el.textContent = ok ? 'Verbunden · Auto-Sync aktiv' : 'Offline · lokal gespeichert'; });
  }
  function scheduleInitRetry() { clearTimeout(_retryTimer); _retryTimer = setTimeout(init, 1800); }
  async function init() {
    patchStorage();
    const cfg = window.GB_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || String(cfg.url).includes('PASTE_')) { updateStatusDot(false); return; }
    if (!window.supabase || !window.supabase.createClient) { updateStatusDot(false); scheduleInitRetry(); return; }
    if (_syncReady) return;
    _syncReady = true;
    const pulled = await pull(false, true);
    if (pulled && window.GB && window.GB.onRemoteSync) window.GB.onRemoteSync();
    if (!pulled) await push(true);
    subscribeRealtime();
  }
  window.GBCloudSync = { init, push, pull, isConfigured, uploadImage, buildPayload, applyPayload };
  window.addEventListener('load', init);
}());
