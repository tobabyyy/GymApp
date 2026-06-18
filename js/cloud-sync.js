(function () {
  'use strict';

  const TABLE     = 'gymbaddies_sync';
  const SYNC_ID   = 'gymbaddies-shared';
  const MODEL_VER = 8;   // bumped – new merge logic
  const DEBOUNCE  = 2500;
  const POLL_MS   = 15000;

  let _client          = null;
  let _pushTimer       = null;
  let _pollTimer       = null;
  let _retryTimer      = null;
  let _applyingRemote  = false;
  let _lastPushTs      = 0;
  let _lastRemoteTs    = 0;
  let _localUpdatedAt  = Date.now(); // tracks when WE last wrote anything managed
  let _syncReady       = false;

  // ── Supabase client ────────────────────────────────────────────────────
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
  function lsWrite(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  function isManaged(key) {
    const prefixes = ['pinnedPlans_','theme_','trainingLog_','sessions_','prs_',
      'done_','h_','lastWorkoutSummary_','deload_','extra_','order_','skipped_',
      'workoutHistory_','pendingSwaps_','draft_','run_'];
    const globals = ['users','customPlans','customExercises','hiddenExercises',
      'favoriteExercises','exerciseCategories','theme_default','lang',
      'gb_data_model_version','gb_app_version','restTimerPos'];
    return globals.includes(key) || prefixes.some(p => key.startsWith(p));
  }

  // ── Build local payload ────────────────────────────────────────────────
  function buildPayload() {
    const users = lsRead('users', []);
    const perUser = {};

    users.forEach(name => {
      const done = {}, history = {}, misc = {};

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('done_' + name + '_')) done[k] = lsRead(k, true);
        if (k.startsWith('h_')) {
          const entries = lsRead(k, []).filter(e => e && e.user === name);
          if (entries.length) history[k.slice(2)] = entries;
        }
        if (k === 'workoutHistory_' + name ||
            k === 'pendingSwaps_' + name ||
            k.startsWith('extra_'   + name + '_') ||
            k.startsWith('order_'   + name + '_') ||
            k.startsWith('skipped_' + name + '_') ||
            k.startsWith('draft_'   + name + '_') ||
            k.startsWith('run_'     + name + '_')) {
          misc[k] = lsRead(k, null);
        }
      }

      perUser[name] = {
        // ── Timestamp per user block – key to smarter merge ──────────────
        _updatedAt:      lsRead('userUpdatedAt_' + name, 0),
        pinnedPlans:     lsRead('pinnedPlans_'   + name, null),
        theme:           lsRead('theme_'         + name, null),
        deload:          lsRead('deload_'        + name, false),
        trainingLog:     lsRead('trainingLog_'   + name, []),
        sessions:        lsRead('sessions_'      + name, []),
        prs:             lsRead('prs_'           + name, []),
        workoutHistory:  lsRead('workoutHistory_'+ name, []),
        pendingSwaps:    lsRead('pendingSwaps_'  + name, []),
        lastSummary:     lsRead('lastWorkoutSummary_' + name, null),
        done, history, misc,
      };
    });

    return {
      version:   MODEL_VER,
      updatedAt: new Date().toISOString(),
      // Global-level timestamp so we can compare global vs global
      _globalUpdatedAt: lsRead('globalUpdatedAt', 0),
      model: {
        global: {
          users,
          appVersion:        lsRead('gb_app_version',       '7.3.19'),
          dataModelVersion:  lsRead('gb_data_model_version', MODEL_VER),
          customPlans:       lsRead('customPlans',           {}),
          customExercises:   lsRead('customExercises',       []),
          hiddenExercises:   lsRead('hiddenExercises',       []),
          favoriteExercises: lsRead('favoriteExercises',     []),
          exerciseCategories:lsRead('exerciseCategories',    {}),
          themeDefault:      lsRead('theme_default',         'dark'),
          lang:              lsRead('lang',                  'de'),
          restTimerPos:      lsRead('restTimerPos',          null),
        },
        users: perUser,
      },
    };
  }

  // ── Deduplicate an array by a computed key ─────────────────────────────
  function dedupeBy(arr, keyFn) {
    const map = new Map();
    (arr || []).forEach(x => {
      if (!x) return;
      const k = keyFn(x);
      // keep the one with the higher ts (newer wins within same key)
      if (!map.has(k) || (x.ts || 0) > (map.get(k).ts || 0)) {
        map.set(k, x);
      }
    });
    return [...map.values()];
  }

  // ── Stable key for a training history entry ────────────────────────────
  function histKey(row, exId) {
    // Use explicit id if present, otherwise construct from stable fields
    if (row.id)  return row.id;
    if (row.ts)  return [row.user, row.ts].join('|');
    return [row.user, row.date, row.exercise || exId].join('|');
  }

  // ── Merge two payloads – NEWER WINS per block ──────────────────────────
  function mergePayloads(local, remote) {
    if (!remote || !remote.model) return local;
    if (!local  || !local.model)  return remote;

    const lg = local.model.global  || {};
    const rg = remote.model.global || {};
    const lu = local.model.users   || {};
    const ru = remote.model.users  || {};

    // ── Global block: newer timestamp wins field by field ─────────────────
    const localGlobalTs  = local._globalUpdatedAt  || 0;
    const remoteGlobalTs = remote._globalUpdatedAt || 0;

    // For scalar globals, just take newer block winner
    const mergedGlobal = remoteGlobalTs >= localGlobalTs
      ? Object.assign({}, lg, rg)   // remote wins scalars but keep any local-only keys
      : Object.assign({}, rg, lg);  // local wins scalars

    // Users list = union (never drop a user)
    const allUsers = [...new Set([...(lg.users || []), ...(rg.users || [])])];
    mergedGlobal.users = allUsers;

    // customPlans: newer global wins, but always keep keys unique
    // Use the block with more keys as a tiebreaker
    const lp = lg.customPlans || {}, rp = rg.customPlans || {};
    const lpCount = Object.keys(lp).length, rpCount = Object.keys(rp).length;
    mergedGlobal.customPlans = remoteGlobalTs >= localGlobalTs
      ? Object.assign({}, lp, rp)
      : Object.assign({}, rp, lp);

    // customExercises: deduplicated union by name
    mergedGlobal.customExercises = dedupeBy(
      [...(lg.customExercises || []), ...(rg.customExercises || [])],
      x => x.n || x.name
    );

    // hiddenExercises / favoriteExercises: union
    mergedGlobal.hiddenExercises   = [...new Set([...(lg.hiddenExercises || []),   ...(rg.hiddenExercises || [])])];
    mergedGlobal.favoriteExercises = [...new Set([...(lg.favoriteExercises || []), ...(rg.favoriteExercises || [])])];

    // ── Per-user merge ─────────────────────────────────────────────────────
    const mergedUsers = {};
    allUsers.forEach(name => {
      const l = lu[name] || {};
      const r = ru[name] || {};

      // Compare user-level timestamps
      const lts = l._updatedAt || 0;
      const rts = r._updatedAt || 0;
      const localNewer  = lts >= rts;
      const remoteNewer = rts >= lts;

      const m = {};

      // Scalar: newer user block wins
      if (localNewer) {
        m._updatedAt  = lts;
        m.pinnedPlans = l.pinnedPlans  ?? r.pinnedPlans;
        m.theme       = l.theme        ?? r.theme;
        m.deload      = l.deload       ?? r.deload;
        m.lastSummary = l.lastSummary  ?? r.lastSummary;
      } else {
        m._updatedAt  = rts;
        m.pinnedPlans = r.pinnedPlans  ?? l.pinnedPlans;
        m.theme       = r.theme        ?? l.theme;
        m.deload      = r.deload       ?? l.deload;
        m.lastSummary = r.lastSummary  ?? l.lastSummary;
      }

      // Arrays with unique entries: MERGE both sides, deduplicate
      ['trainingLog','sessions','workoutHistory','pendingSwaps'].forEach(k => {
        m[k] = dedupeBy(
          [...(r[k] || []), ...(l[k] || [])],
          x => x.ts ? String(x.ts) : JSON.stringify(x)
        ).sort((a, b) => (a.ts || 0) - (b.ts || 0));
      });

      // PRs: merge, keep highest kg per exercise
      const prMap = new Map();
      [...(r.prs || []), ...(l.prs || [])].forEach(pr => {
        const key = (pr.exercise || '') + '|' + (pr.user || '');
        const existing = prMap.get(key);
        if (!existing || (parseFloat(pr.kg) || 0) > (parseFloat(existing.kg) || 0)) {
          prMap.set(key, pr);
        }
      });
      m.prs = [...prMap.values()];

      // done flags: union (once done = done)
      m.done = Object.assign({}, r.done || {}, l.done || {});

      // misc: newer user block wins per key
      m.misc = localNewer
        ? Object.assign({}, r.misc || {}, l.misc || {})
        : Object.assign({}, l.misc || {}, r.misc || {});

      // history: deduplicated union per exercise, sorted by ts
      const allExIds = new Set([
        ...Object.keys(l.history || {}),
        ...Object.keys(r.history || {}),
      ]);
      m.history = {};
      allExIds.forEach(exId => {
        const combined = [
          ...(((r.history || {})[exId]) || []),
          ...(((l.history || {})[exId]) || []),
        ];
        m.history[exId] = dedupeBy(combined, row => histKey(row, exId))
          .sort((a, b) => (a.ts || 0) - (b.ts || 0))
          .slice(-240);
      });

      mergedUsers[name] = m;
    });

    return {
      version:          MODEL_VER,
      updatedAt:        new Date().toISOString(),
      _globalUpdatedAt: Math.max(localGlobalTs, remoteGlobalTs),
      model: {
        global: mergedGlobal,
        users:  mergedUsers,
      },
    };
  }

  // ── Apply a payload to localStorage ───────────────────────────────────
  function clearManaged() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    keys.forEach(k => { if (k && isManaged(k)) localStorage.removeItem(k); });
  }

  function applyPayload(payload) {
    if (!payload || !payload.model) return false;
    _applyingRemote = true;
    try {
      const g  = payload.model.global || {};
      const pu = payload.model.users  || {};

      clearManaged();

      lsWrite('users',               Array.isArray(g.users) ? g.users : Object.keys(pu));
      lsWrite('customPlans',         g.customPlans        || {});
      lsWrite('customExercises',     Array.isArray(g.customExercises)     ? g.customExercises     : []);
      lsWrite('hiddenExercises',     Array.isArray(g.hiddenExercises)     ? g.hiddenExercises     : []);
      lsWrite('favoriteExercises',   Array.isArray(g.favoriteExercises)   ? g.favoriteExercises   : []);
      lsWrite('exerciseCategories',  g.exerciseCategories || {});
      lsWrite('theme_default',       g.themeDefault       || 'dark');
      lsWrite('lang',                g.lang               || 'de');
      if (g.restTimerPos) lsWrite('restTimerPos', g.restTimerPos);
      lsWrite('gb_data_model_version', Number(g.dataModelVersion || payload.version || MODEL_VER));
      if (g.appVersion) lsWrite('gb_app_version', g.appVersion);
      // Restore global timestamp
      if (payload._globalUpdatedAt) lsWrite('globalUpdatedAt', payload._globalUpdatedAt);

      const allHistory = {};
      Object.keys(pu).forEach(name => {
        const d = pu[name] || {};
        if (d._updatedAt) lsWrite('userUpdatedAt_' + name, d._updatedAt);
        if (Array.isArray(d.pinnedPlans)) lsWrite('pinnedPlans_' + name, d.pinnedPlans);
        if (d.theme)                      lsWrite('theme_'       + name, d.theme);
        if (typeof d.deload === 'boolean') lsWrite('deload_'     + name, d.deload);
        lsWrite('trainingLog_'        + name, Array.isArray(d.trainingLog)    ? d.trainingLog    : []);
        lsWrite('sessions_'           + name, Array.isArray(d.sessions)       ? d.sessions       : []);
        lsWrite('prs_'                + name, Array.isArray(d.prs)            ? d.prs            : []);
        lsWrite('workoutHistory_'     + name, Array.isArray(d.workoutHistory) ? d.workoutHistory : []);
        lsWrite('pendingSwaps_'       + name, Array.isArray(d.pendingSwaps)   ? d.pendingSwaps   : []);
        if (d.lastSummary) lsWrite('lastWorkoutSummary_' + name, d.lastSummary);
        Object.keys(d.misc || {}).forEach(k => { if (isManaged(k)) lsWrite(k, d.misc[k]); });
        Object.keys(d.done || {}).forEach(k => lsWrite(k, d.done[k]));
        Object.keys(d.history || {}).forEach(exId => {
          allHistory[exId] = allHistory[exId] || [];
          allHistory[exId].push(...(d.history[exId] || []));
        });
      });

      Object.keys(allHistory).forEach(exId => {
        const sorted = dedupeBy(allHistory[exId], row => histKey(row, exId))
          .sort((a, b) => (a.ts || 0) - (b.ts || 0))
          .slice(-240);
        lsWrite('h_' + exId, sorted);
      });

      return true;
    } finally {
      _applyingRemote = false;
    }
  }

  // ── Push: read-merge-write ─────────────────────────────────────────────
  async function push(silent) {
    const sb = client();
    if (!sb) return false;
    try {
      let local = buildPayload();
      // Always read current remote first, merge before writing
      const { data: rd } = await sb.from(TABLE)
        .select('payload,updated_at').eq('sync_id', SYNC_ID).maybeSingle();
      if (rd && rd.payload) {
        local = mergePayloads(local, rd.payload);
      }
      const { error } = await sb.from(TABLE).upsert(
        { sync_id: SYNC_ID, payload: local, updated_at: local.updatedAt },
        { onConflict: 'sync_id' }
      );
      if (error) throw error;
      _lastPushTs    = Date.now();
      _lastRemoteTs  = _lastPushTs;
      updateStatusDot(true);
      if (!silent) toast('☁️ Gespeichert.');
      return true;
    } catch (e) {
      console.warn('[GBSync] push:', e?.message ?? e);
      updateStatusDot(false);
      return false;
    }
  }

  // ── Pull: merge remote into local, write result ───────────────────────
  async function pull(reloadAfter, force) {
    const sb = client();
    if (!sb) return false;
    try {
      const { data, error } = await sb.from(TABLE)
        .select('payload,updated_at').eq('sync_id', SYNC_ID).maybeSingle();
      if (error) throw error;
      if (!data || !data.payload) return false;

      const remoteTs = new Date(data.updated_at || data.payload.updatedAt || 0).getTime() || Date.now();
      if (!force && remoteTs <= _lastRemoteTs) return false;
      _lastRemoteTs = remoteTs;

      // Merge remote with current local state (local timestamps preserved)
      const merged = mergePayloads(buildPayload(), data.payload);
      applyPayload(merged);

      updateStatusDot(true);
      if (reloadAfter) setTimeout(() => location.reload(), 500);
      return true;
    } catch (e) {
      console.warn('[GBSync] pull:', e?.message ?? e);
      updateStatusDot(false);
      return false;
    }
  }

  // ── Auto-push on localStorage writes ──────────────────────────────────
  function schedulePush() {
    if (_applyingRemote) return;
    _localUpdatedAt = Date.now();
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

  // ── Stamp user/global timestamps when app writes data ─────────────────
  // Call this from app.js whenever a user's data changes
  function stampUser(name) {
    const ts = Date.now();
    try { localStorage.setItem('userUpdatedAt_' + name, JSON.stringify(ts)); } catch {}
  }
  function stampGlobal() {
    const ts = Date.now();
    try { localStorage.setItem('globalUpdatedAt', JSON.stringify(ts)); } catch {}
  }

  // ── Image upload ───────────────────────────────────────────────────────
  async function uploadImage(file, name) {
    const sb = client();
    if (!sb || !file) return null;
    try {
      const ext  = (file.name || 'img').split('.').pop().toLowerCase() || 'jpg';
      const safe = String(name || 'exercise').replace(/[^a-zA-Z0-9_-]/g, '_');
      const path = 'exercises/' + safe + '_' + Date.now() + '.' + ext;
      const { error } = await sb.storage.from('gymbaddies-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = sb.storage.from('gymbaddies-images').getPublicUrl(path);
      return data?.publicUrl ?? null;
    } catch (e) {
      console.warn('[GBSync] uploadImage:', e?.message ?? e);
      return null;
    }
  }

  // ── Realtime + polling ─────────────────────────────────────────────────
  function startPolling() {
    clearInterval(_pollTimer);
    _pollTimer = setInterval(async () => {
      const changed = await pull(false, false);
      if (changed && window.GB?.onRemoteSync) window.GB.onRemoteSync();
    }, POLL_MS);
  }

  function subscribeRealtime() {
    const sb = client();
    if (!sb) return;
    try {
      sb.channel('gb-live')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: TABLE, filter: 'sync_id=eq.' + SYNC_ID },
          async (evt) => {
            const remoteTs = new Date(evt.new?.updated_at || 0).getTime();
            if (remoteTs && remoteTs <= _lastPushTs + 3000) return; // own push echo
            const changed = await pull(false, false);
            if (changed && window.GB?.onRemoteSync) window.GB.onRemoteSync();
          })
        .subscribe();
    } catch (e) {
      console.warn('[GBSync] realtime:', e?.message ?? e);
    }
    startPolling();
  }

  // ── Status dot ─────────────────────────────────────────────────────────
  function updateStatusDot(ok) {
    document.querySelectorAll('.cloud-dot').forEach(d => {
      d.style.background = ok ? 'var(--green)' : 'var(--orange)';
    });
    document.querySelectorAll('#cloud-status-text').forEach(el => {
      el.textContent = ok ? 'Verbunden · Auto-Sync aktiv' : 'Offline · lokal gespeichert';
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function scheduleInitRetry() {
    clearTimeout(_retryTimer);
    _retryTimer = setTimeout(init, 1800);
  }

  async function init() {
    patchStorage();
    const cfg = window.GB_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.anonKey || String(cfg.url).includes('PASTE_')) {
      updateStatusDot(false); return;
    }
    if (!window.supabase?.createClient) {
      updateStatusDot(false); scheduleInitRetry(); return;
    }
    if (_syncReady) return;
    _syncReady = true;
    const pulled = await pull(false, true);
    if (pulled && window.GB?.onRemoteSync) window.GB.onRemoteSync();
    if (!pulled) await push(true);
    subscribeRealtime();
  }

  window.GBCloudSync = {
    init, push, pull, isConfigured, uploadImage,
    buildPayload, applyPayload, mergePayloads,
    stampUser, stampGlobal,   // expose for app.js use
  };
  window.addEventListener('load', init);
}());
