(function () {
  'use strict';

  const TABLE = 'gymbaddies_sync';
  const SYNC_ID_KEY = 'gb_sync_id';
  const AUTO_KEY = 'gb_auto_sync';
  const MODEL_VERSION = 2;
  let client = null;
  let isApplyingRemote = false;
  let pushTimer = null;

  function qs(id) { return document.getElementById(id); }
  function toast(message) {
    const el = qs('app-toast');
    if (!el) { console.log(message); return; }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.__gbCloudToast);
    window.__gbCloudToast = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function configured() {
    const cfg = window.GB_SUPABASE_CONFIG || {};
    return cfg.url && cfg.anonKey && !cfg.url.includes('PASTE_') && !cfg.anonKey.includes('PASTE_');
  }
  function getClient() {
    if (client) return client;
    if (!configured() || !window.supabase) return null;
    client = window.supabase.createClient(window.GB_SUPABASE_CONFIG.url, window.GB_SUPABASE_CONFIG.anonKey);
    return client;
  }
  function getSyncId() { return localStorage.getItem(SYNC_ID_KEY) || ''; }
  function setSyncId(value) { localStorage.setItem(SYNC_ID_KEY, String(value || '').trim()); }
  function autoEnabled() { return localStorage.getItem(AUTO_KEY) === '1'; }
  function setAutoEnabled(value) { localStorage.setItem(AUTO_KEY, value ? '1' : '0'); }
  function safeParse(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } }
  function readJson(key, fallback) { return safeParse(localStorage.getItem(key), fallback); }
  function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function users() { const value = readJson('users', []); return Array.isArray(value) ? value : []; }
  function startsAny(key, prefixes) { return prefixes.some((prefix) => key.indexOf(prefix) === 0); }

  function managedKey(key) {
    return key === 'users' || key === 'customPlans' || key === 'customExercises' || key === 'theme_default' ||
      startsAny(key, ['pinnedPlans_', 'theme_', 'trainingLog_', 'sessions_', 'prs_', 'done_', 'h_']);
  }

  function collectUserData(profileName) {
    const data = {
      pinnedPlans: readJson('pinnedPlans_' + profileName, null),
      theme: readJson('theme_' + profileName, null),
      trainingLog: readJson('trainingLog_' + profileName, []),
      sessions: readJson('sessions_' + profileName, []),
      prs: readJson('prs_' + profileName, []),
      done: {},
      history: {}
    };
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.indexOf('done_' + profileName + '_') === 0) data.done[key] = readJson(key, true);
      if (key.indexOf('h_') === 0) {
        const exerciseId = key.slice(2);
        const entries = readJson(key, []).filter((entry) => entry && entry.user === profileName);
        if (entries.length) data.history[exerciseId] = entries;
      }
    }
    return data;
  }

  function localPayload() {
    const profileNames = users();
    const perUser = {};
    profileNames.forEach((name) => { perUser[name] = collectUserData(name); });
    return {
      version: MODEL_VERSION,
      updatedAt: new Date().toISOString(),
      model: {
        global: {
          users: profileNames,
          customPlans: readJson('customPlans', {}),
          customExercises: readJson('customExercises', []),
          themeDefault: readJson('theme_default', 'dark'),
          appVersion: 'gymbaddies-local-v2'
        },
        users: perUser
      }
    };
  }

  function removeManagedLocalData() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) keys.push(localStorage.key(i));
    keys.filter(Boolean).forEach((key) => { if (managedKey(key)) localStorage.removeItem(key); });
  }

  function applyModelPayload(payload) {
    const global = payload.model && payload.model.global ? payload.model.global : {};
    const perUser = payload.model && payload.model.users ? payload.model.users : {};
    removeManagedLocalData();
    writeJson('users', Array.isArray(global.users) ? global.users : Object.keys(perUser));
    writeJson('customPlans', global.customPlans || {});
    writeJson('customExercises', Array.isArray(global.customExercises) ? global.customExercises : []);
    writeJson('theme_default', global.themeDefault || 'dark');

    const historyByExercise = {};
    Object.keys(perUser).forEach((profileName) => {
      const data = perUser[profileName] || {};
      if (Array.isArray(data.pinnedPlans)) writeJson('pinnedPlans_' + profileName, data.pinnedPlans);
      if (data.theme) writeJson('theme_' + profileName, data.theme);
      writeJson('trainingLog_' + profileName, Array.isArray(data.trainingLog) ? data.trainingLog : []);
      writeJson('sessions_' + profileName, Array.isArray(data.sessions) ? data.sessions : []);
      writeJson('prs_' + profileName, Array.isArray(data.prs) ? data.prs : []);
      Object.keys(data.done || {}).forEach((key) => writeJson(key, data.done[key]));
      Object.keys(data.history || {}).forEach((exerciseId) => {
        if (!historyByExercise[exerciseId]) historyByExercise[exerciseId] = [];
        historyByExercise[exerciseId].push(...(Array.isArray(data.history[exerciseId]) ? data.history[exerciseId] : []));
      });
    });
    Object.keys(historyByExercise).forEach((exerciseId) => {
      const sorted = historyByExercise[exerciseId].sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-200);
      writeJson('h_' + exerciseId, sorted);
    });
  }

  function applyLegacyPayload(payload) {
    if (!payload || !payload.items) throw new Error('Ungueltige Cloud-Daten');
    removeManagedLocalData();
    Object.keys(payload.items).forEach((key) => localStorage.setItem(key, payload.items[key]));
  }

  function applyPayload(payload) {
    isApplyingRemote = true;
    try {
      if (payload && payload.version >= 2 && payload.model) applyModelPayload(payload);
      else applyLegacyPayload(payload);
    } finally {
      isApplyingRemote = false;
    }
  }

  async function pushToCloud(silent) {
    const id = getSyncId();
    const sb = getClient();
    if (!sb) { if (!silent) toast('Supabase ist noch nicht konfiguriert.'); return false; }
    if (!id) { if (!silent) toast('Bitte zuerst eine Sync-ID festlegen.'); return false; }
    const { error } = await sb.from(TABLE).upsert({ sync_id: id, payload: localPayload(), updated_at: new Date().toISOString() }, { onConflict: 'sync_id' });
    if (error) { console.warn(error); if (!silent) toast('Cloud Upload fehlgeschlagen.'); return false; }
    if (!silent) toast('Daten in die Cloud hochgeladen.');
    return true;
  }

  async function pullFromCloud() {
    const id = getSyncId();
    const sb = getClient();
    if (!sb) { toast('Supabase ist noch nicht konfiguriert.'); return false; }
    if (!id) { toast('Bitte zuerst eine Sync-ID festlegen.'); return false; }
    const { data, error } = await sb.from(TABLE).select('payload,updated_at').eq('sync_id', id).maybeSingle();
    if (error) { console.warn(error); toast('Cloud Download fehlgeschlagen.'); return false; }
    if (!data) { toast('Keine Cloud-Daten gefunden. Erst hochladen.'); return false; }
    applyPayload(data.payload);
    toast('Cloud-Daten geladen. App startet neu.');
    setTimeout(() => location.reload(), 800);
    return true;
  }

  function scheduleAutoPush() {
    if (isApplyingRemote || !autoEnabled() || !getSyncId() || !configured()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => pushToCloud(true), 1800);
  }

  function patchLocalStorage() {
    if (window.__gbStoragePatched) return;
    window.__gbStoragePatched = true;
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (this === localStorage && key !== AUTO_KEY && key !== SYNC_ID_KEY && managedKey(key)) scheduleAutoPush();
    };
    Storage.prototype.removeItem = function (key) {
      originalRemoveItem.call(this, key);
      if (this === localStorage && key !== AUTO_KEY && key !== SYNC_ID_KEY && managedKey(key)) scheduleAutoPush();
    };
  }

  function renderCloudCard() {
    const wrap = qs('settings-content');
    if (!wrap || qs('cloud-sync-card')) return;
    const ok = configured();
    const id = getSyncId();
    const auto = autoEnabled();
    const card = document.createElement('div');
    card.className = 'settings-card';
    card.id = 'cloud-sync-card';
    card.innerHTML = `
      <div class="settings-title">☁️ Cloud Sync</div>
      <div class="settings-sub">Synchronisiert GymBaddies mit getrenntem Datenmodell: Übungen und Pläne gemeinsam, persönliche Trainingsdaten pro Profil.</div>
      <div class="quick-label">Status</div>
      <div class="settings-note">${ok ? 'Supabase konfiguriert.' : 'Supabase noch nicht konfiguriert: js/supabase.js ausfüllen.'}</div>
      <input class="builder-input" id="cloud-sync-id" placeholder="Sync-ID z. B. gymbaddies-team" value="${id}">
      <div class="settings-actions">
        <button class="settings-action" id="save-sync-id" type="button">ID speichern</button>
        <button class="settings-action" id="toggle-auto-sync" type="button">${auto ? 'Auto-Sync an' : 'Auto-Sync aus'}</button>
      </div>
      <div class="settings-actions">
        <button class="settings-action" id="cloud-push" type="button">Dieses Gerät hochladen</button>
        <button class="settings-action" id="cloud-pull" type="button">Cloud laden</button>
      </div>
      <div class="settings-note"><strong>Gemeinsam:</strong> Profile, Übungsdatenbank, eigene Übungen, eigene Pläne. <br><strong>Pro Profil:</strong> angeheftete Pläne, Theme, Verlauf, PRs, abgeschlossene Tage.</div>
    `;
    wrap.appendChild(card);
    qs('save-sync-id').addEventListener('click', () => { setSyncId(qs('cloud-sync-id').value); toast('Sync-ID gespeichert.'); });
    qs('toggle-auto-sync').addEventListener('click', () => { setAutoEnabled(!autoEnabled()); document.getElementById('cloud-sync-card')?.remove(); renderCloudCard(); });
    qs('cloud-push').addEventListener('click', () => { setSyncId(qs('cloud-sync-id').value); pushToCloud(false); });
    qs('cloud-pull').addEventListener('click', () => { setSyncId(qs('cloud-sync-id').value); pullFromCloud(); });
  }

  function install() {
    patchLocalStorage();
    document.addEventListener('click', (event) => { if (event.target && event.target.closest && (event.target.closest('#menu-settings') || event.target.closest('#top-profile-menu'))) setTimeout(renderCloudCard, 150); });
    const observer = new MutationObserver(() => {
      const settings = document.getElementById('settings-content');
      if (settings && settings.classList.contains('active')) renderCloudCard();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    if (autoEnabled() && getSyncId() && configured()) setTimeout(() => pushToCloud(true), 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.GBCloudSync = { pushToCloud, pullFromCloud, localPayload, renderCloudCard };
}());
