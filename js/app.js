(function () {
  'use strict';
  const S = window.GBStore;
  const D = window.GB;

  // ── State ──────────────────────────────────────────────────────────────────
  let plans = {}, allExercises = [];
  let plan = null, days = [];
  let day = 0, screen = 'home', user = null;
  let warmup = {}, openExercise = null;
  let inputs = {}, setCounts = {}, finished = {};
  let progressExercise = null, progressUser = null;
  let charts = {}, planDraft = null;
  let daySwaps = {}, swapOpen = {};
  let finishConfirm = false;
  let completedSetTimers = {};
  let currentLang = 'de';

  // ── Helpers ────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clone = v => JSON.parse(JSON.stringify(v));
  const styleFor = m => D.STYLE[m] || D.STYLE['Brust'];
  const initial = n => String(n || '?').charAt(0).toUpperCase();
  const colorFor = i => D.COLORS[i % D.COLORS.length];
  const dateStr = () => new Date().toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'2-digit'});
  const avg = arr => +(arr.reduce((s,v)=>s+v,0)/Math.max(arr.length,1)).toFixed(1);

  // ── i18n ───────────────────────────────────────────────────────────────────
  const STRINGS = {
    de: {
      noPlanTitle: 'Kein Plan ausgewählt',
      noPlanDesc: 'Hefte dir in der Planbibliothek einen Plan an – er erscheint dann hier.',
      pinPlan: 'Plan anheften',
      langSaved: 'Sprache gespeichert.',
      profileDeleted: 'Profil gelöscht.',
      deleteConfirm: 'Profil "{name}" wirklich löschen? Alle Trainingsdaten werden entfernt.',
      exerciseSaved: 'Übung gespeichert.',
      exerciseDeleted: 'Übung gelöscht.',
      renamedTo: 'Umbenannt.',
      imageSaved: 'Bild aktualisiert.',
      planSaved: 'Plan gespeichert.',
      fillLast: 'Letzte Werte übernommen.',
      noHistory: 'Noch keine gespeicherten Werte.',
      newPR: 'Neue PR: ',
      trainingSaved: 'Training gespeichert! Weiter so',
      confirmFinish: 'Training wirklich abschließen?',
      stillOpen: 'Noch {n} Übung(en) offen.',
      allDone: 'Alle Übungen erledigt!',
      yesFinish: 'Abschließen',
      cancel: 'Abbrechen',
      setsSaved: 'Einheit gespeichert',
      nameRequired: 'Bitte Namen eintragen.',
      atLeastOneEx: 'Mindestens eine Übung pro Tag hinzufügen.',
      settingsTitle: 'Einstellungen',
      designLabel: 'Design', dark: '🌙 Dunkel', light: '☀️ Hell',
      langLabel: 'Sprache', profilesLabel: 'Profile',
      deleteProfile: 'Löschen',
      exerciseDBLabel: 'Übungsdatenbank bearbeiten',
      cloudLabel: '☁️ Cloud-Sync',
      cloudConnected: 'Verbunden · Auto-Sync aktiv',
      cloudOffline: 'Offline · lokal gespeichert',
      addExercise: 'Übung hinzufügen',
      back: '← Zurück',
    },
    en: {
      noPlanTitle: 'No plan selected',
      noPlanDesc: 'Pin a plan in the plan library – it will appear here.',
      pinPlan: 'Pin plan',
      langSaved: 'Language saved.',
      profileDeleted: 'Profile deleted.',
      deleteConfirm: 'Really delete profile "{name}"? All training data will be removed.',
      exerciseSaved: 'Exercise saved.',
      exerciseDeleted: 'Exercise deleted.',
      renamedTo: 'Renamed.',
      imageSaved: 'Image updated.',
      planSaved: 'Plan saved.',
      fillLast: 'Last values loaded.',
      noHistory: 'No saved values yet.',
      newPR: 'New PR: ',
      trainingSaved: 'Training saved! Well done',
      confirmFinish: 'Really finish training?',
      stillOpen: '{n} exercise(s) still open.',
      allDone: 'All exercises done!',
      yesFinish: 'Finish',
      cancel: 'Cancel',
      setsSaved: 'Session saved',
      nameRequired: 'Please enter a name.',
      atLeastOneEx: 'Add at least one exercise per day.',
      settingsTitle: 'Settings',
      designLabel: 'Design', dark: '🌙 Dark', light: '☀️ Light',
      langLabel: 'Language', profilesLabel: 'Profiles',
      deleteProfile: 'Delete',
      exerciseDBLabel: 'Edit exercise database',
      cloudLabel: '☁️ Cloud Sync',
      cloudConnected: 'Connected · Auto-Sync active',
      cloudOffline: 'Offline · saved locally',
      addExercise: 'Add exercise',
      back: '← Back',
    },
    th: {
      noPlanTitle: 'ยังไม่ได้เลือกแผน',
      noPlanDesc: 'ปักหมุดแผนในคลัง – แล้วมันจะปรากฏที่นี่',
      pinPlan: 'ปักหมุดแผน',
      langSaved: 'บันทึกภาษาแล้ว',
      profileDeleted: 'ลบโปรไฟล์แล้ว',
      deleteConfirm: 'ลบโปรไฟล์ "{name}" จริงไหม? ข้อมูลการฝึกทั้งหมดจะถูกลบ',
      exerciseSaved: 'บันทึกท่าออกกำลังกายแล้ว',
      exerciseDeleted: 'ลบท่าออกกำลังกายแล้ว',
      renamedTo: 'เปลี่ยนชื่อแล้ว',
      imageSaved: 'อัปเดตรูปภาพแล้ว',
      planSaved: 'บันทึกแผนแล้ว',
      fillLast: 'โหลดค่าล่าสุดแล้ว',
      noHistory: 'ยังไม่มีค่าที่บันทึก',
      newPR: 'สถิติใหม่: ',
      trainingSaved: 'บันทึกการฝึกแล้ว เก่งมาก',
      confirmFinish: 'จบการฝึกจริงไหม?',
      stillOpen: 'ยังเหลืออีก {n} ท่า',
      allDone: 'ทำครบทุกท่าแล้ว!',
      yesFinish: 'จบเลย',
      cancel: 'ยกเลิก',
      setsSaved: 'บันทึกเซตแล้ว',
      nameRequired: 'กรุณาใส่ชื่อ',
      atLeastOneEx: 'เพิ่มอย่างน้อยหนึ่งท่าต่อวัน',
      settingsTitle: 'ตั้งค่า',
      designLabel: 'ธีม', dark: '🌙 มืด', light: '☀️ สว่าง',
      langLabel: 'ภาษา', profilesLabel: 'โปรไฟล์',
      deleteProfile: 'ลบ',
      exerciseDBLabel: 'แก้ไขฐานข้อมูลท่า',
      cloudLabel: '☁️ คลาวด์ซิงค์',
      cloudConnected: 'เชื่อมต่อแล้ว · ซิงค์อัตโนมัติ',
      cloudOffline: 'ออฟไลน์ · บันทึกในเครื่อง',
      addExercise: 'เพิ่มท่า',
      back: '← กลับ',
    },
  };
  function t(key, vars) {
    let str = (STRINGS[currentLang] || STRINGS.de)[key] || (STRINGS.de)[key] || key;
    if (vars) Object.keys(vars).forEach(k => { str = str.replace('{' + k + '}', vars[k]); });
    return str;
  }

  // ── Custom exercises ───────────────────────────────────────────────────────
  function getCustomExercises() { return S.get('customExercises', []); }
  function saveCustomExercises(items) { S.set('customExercises', items); }

  function getExerciseDB() {
    const base = D.EXERCISE_DB || [];
    const custom = getCustomExercises();
    const seen = new Set();
    return base.concat(custom).filter(ex => {
      const k = ex.m + '|' + ex.n;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  function imageFor(name) {
    const customMap = {};
    getCustomExercises().forEach(ex => { if (ex.image) customMap[ex.n] = ex.image; });
    return customMap[name] || D.IMAGES[name] || D.autoImage(name, 'Brust');
  }

  // ── Data helpers ───────────────────────────────────────────────────────────
  function getUsers()    { return S.get('users', []); }
  function saveUsers(u)  { S.set('users', u); }
  function getHistory(id){ return S.get('h_' + id, []); }
  function getTrainingLog(name) { return S.get('trainingLog_' + name, []); }
  function getLastTraining(name) { const log = getTrainingLog(name); return log.length ? log[log.length-1] : null; }

  function getPinnedPlans(name = user) {
    const saved = S.get('pinnedPlans_' + name, null);
    return Array.isArray(saved) ? saved.filter(n => plans[n]) : [];
  }
  function setPinned(name, pinned) {
    const set = new Set(getPinnedPlans());
    if (pinned) set.add(name); else set.delete(name);
    S.set('pinnedPlans_' + user, [...set].filter(n => plans[n]));
  }

  function getNextSuggestion(name) {
    const pinned = getPinnedPlans(name);
    const fallback = pinned.length && plans[pinned[0]] ? pinned[0] : null;
    const last = getLastTraining(name);
    if (!last || !plans[last.plan]) {
      if (!fallback) return null;
      return { plan: fallback, dayIndex: 0, label: plans[fallback][0].label };
    }
    const next = ((Number(last.dayIndex) || 0) + 1) % plans[last.plan].length;
    return { plan: last.plan, dayIndex: next, label: plans[last.plan][next].label };
  }

  function loadPlans() {
    plans = Object.assign({}, D.BASE_PLANS, S.get('customPlans', {}));
    // Merge custom exercises into allExercises list
    allExercises = getExerciseDB();
    getCustomExercises().forEach(ex => {
      if (!allExercises.find(e => e.n === ex.n)) allExercises.push(ex);
    });
    if (!progressExercise && allExercises.length) progressExercise = allExercises[0].n;
  }

  function saveCustomPlans() {
    const base = Object.keys(D.BASE_PLANS);
    const custom = {};
    Object.keys(plans).forEach(n => { if (!base.includes(n)) custom[n] = plans[n]; });
    S.set('customPlans', custom);
    loadPlans();
  }

  function doneKey(id) { return 'done_' + user + '_' + plan + '_' + day + '_' + dateStr() + '_' + id; }
  function swapKey(id)  { return plan + '_' + day + '_' + id; }
  function displayExercise(ex) { return daySwaps[swapKey(ex.id)] || ex; }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg) {
    const el = $('app-toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ── User screen ────────────────────────────────────────────────────────────
  function renderUserScreen() {
    const users = getUsers();
    const list = $('user-list');
    list.innerHTML = '';
    if (!users.length) {
      list.innerHTML = '<div class="user-empty">Noch keine Profile – lege unten eines an.</div>';
      return;
    }
    users.forEach((name, i) => {
      const c = colorFor(i);
      const sess = S.get('sessions_' + name, []);
      const last = getLastTraining(name);
      const next = getNextSuggestion(name);
      const btn = document.createElement('button');
      btn.className = 'user-btn'; btn.type = 'button';
      btn.innerHTML = `
        <div class="avatar" style="background:${c.bg};color:${c.c}">${initial(name)}</div>
        <div class="uinfo">
          <div class="uname">${esc(name)}</div>
          <div class="ustats">${sess.length} Einheiten</div>
          <div class="profile-meta">
            ${last ? `Zuletzt: <strong>${esc(last.plan)} · ${esc(last.label)}</strong>` : 'Noch kein Training'}
            ${next ? `<br><span class="profile-next">→ ${esc(next.plan)} · ${esc(next.label)}</span>` : ''}
          </div>
        </div>
        <div class="uarrow">›</div>`;
      btn.addEventListener('click', () => loginUser(name));
      list.appendChild(btn);
    });
  }

  function addUser() {
    const inp = $('new-user-inp');
    const name = inp.value.trim();
    if (!name) { inp.focus(); return; }
    const users = getUsers();
    if (!users.includes(name)) { users.push(name); saveUsers(users); }
    inp.value = ''; $('add-user-btn').classList.remove('ready');
    renderUserScreen(); loginUser(name);
  }

  function loginUser(name) {
    user = name; progressUser = name;
    currentLang = S.get('lang', 'de');
    applySavedTheme();
    $('screen-users').classList.add('hidden');
    $('screen-app').style.display = 'block';
    const c = colorFor(Math.max(0, getUsers().indexOf(name)));
    $('h-avatar').textContent = initial(name);
    $('h-avatar').style.background = c.bg;
    $('h-avatar').style.color = c.c;
    $('h-name').textContent = name;
    // No auto-select — user must pin a plan
    plan = null; days = [];
    day = 0; warmup = {}; openExercise = null;
    inputs = {}; setCounts = {}; finished = {};
    daySwaps = {}; swapOpen = {}; finishConfirm = false;
    renderPlanTabs(); renderDayTabs(); setScreen('home');
  }

  function goUsers() {
    saveCurrentInputs(); user = null;
    $('screen-app').style.display = 'none';
    $('screen-users').classList.remove('hidden');
    $('new-user-inp').value = '';
    $('add-user-btn').classList.remove('ready');
    renderUserScreen();
  }

  // ── Screen routing ─────────────────────────────────────────────────────────
  function setScreen(next) {
    if (screen === 'train' && next !== 'train') saveCurrentInputs();
    screen = next;

    // Map screen names to content element IDs
    const ID = { home:'home-content', train:'train-content', progress:'prog-content', plans:'plan-content', settings:'settings-content' };
    Object.keys(ID).forEach(s => { $(ID[s])?.classList.toggle('active', s === next); });

    // Header tabs
    $('tab-home').classList.toggle('active',  next === 'home');
    $('tab-train').classList.toggle('active', next === 'train');
    $('tab-progress').classList.toggle('active', next === 'progress');
    $('top-plans').classList.toggle('active', next === 'plans');

    // Training-only chrome
    $('daytabs').style.display    = next === 'train' ? 'flex'  : 'none';
    $('split-tabs').style.display = next === 'train' ? 'flex'  : 'none';
    $('finish-bar').style.display = next === 'train' ? 'block' : 'none';

    $('account-menu')?.classList.remove('show');

    if      (next === 'home')     renderDashboard();
    else if (next === 'train')    renderTraining();
    else if (next === 'progress') renderProgress();
    else if (next === 'plans')    renderPlanBuilder();
    else if (next === 'settings') renderSettings();
  }

  function setPlan(name) {
    saveCurrentInputs();
    if (!plans[name]) return;
    plan = name; days = plans[name]; day = 0;
    openExercise = null; warmup = {}; inputs = {}; setCounts = {}; finished = {};
    renderPlanTabs(); renderDayTabs(); renderTraining();
  }

  function renderPlanTabs() {
    const wrap = $('split-tabs'); wrap.innerHTML = '';
    const pinned = getPinnedPlans().filter(n => plans[n]);
    pinned.forEach(name => {
      const b = document.createElement('button');
      b.className = 'split-btn' + (name === plan ? ' active' : '');
      b.type = 'button'; b.textContent = name;
      b.addEventListener('click', () => setPlan(name));
      wrap.appendChild(b);
    });
  }

  function renderDayTabs() {
    const wrap = $('daytabs'); wrap.innerHTML = '';
    if (!days || !days.length) return;
    days.forEach((d, i) => {
      const allDone = d.ex.every(ex => S.get(doneKey(ex.id), false));
      const b = document.createElement('button');
      b.className = 'daytab' + (i === day ? ' active' : '');
      b.type = 'button';
      b.innerHTML = d.label + (allDone ? ' <span class="day-done-tick">✓</span>' : '');
      b.addEventListener('click', () => {
        saveCurrentInputs(); day = i; openExercise = null;
        warmup = {}; finishConfirm = false;
        renderDayTabs(); renderTraining();
      });
      wrap.appendChild(b);
    });
  }

  // ── Input persistence ──────────────────────────────────────────────────────
  function saveCurrentInputs() {
    if (!user || screen !== 'train' || !days[day]) return;
    if (!inputs[day]) inputs[day] = {};
    days[day].ex.forEach(ex => {
      const n = setCounts[ex.id] || 3;
      inputs[day][ex.id] = Array.from({length: n}, (_, i) => ({
        kg:   $('kg_'   + ex.id + '_' + i)?.value || '',
        reps: $('reps_' + ex.id + '_' + i)?.value || '',
      }));
    });
  }
  function inputVal(id, i, f) { return inputs[day]?.[id]?.[i]?.[f] || ''; }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  function allUserSessions(name) {
    return S.keys().filter(k => k.startsWith('h_')).flatMap(k =>
      S.get(k, []).filter(e => e.user === name).map(e => ({ ...e, exId: k.slice(2) }))
    );
  }
  function weekKey(ts) {
    const d = new Date(ts || Date.now()), s = new Date(d.getFullYear(), 0, 1);
    return d.getFullYear() + '-W' + Math.ceil((Math.floor((d - s) / 86400000) + s.getDay() + 1) / 7);
  }

  function renderDashboard() {
    const pinned = getPinnedPlans();
    const last   = getLastTraining(user);
    const next   = getNextSuggestion(user);
    const log    = getTrainingLog(user).slice(-100);
    const thisWeek = weekKey(Date.now());
    const weekCount = log.filter(e => weekKey(e.ts) === thisWeek).length;
    const sessions  = allUserSessions(user);
    const totalVol  = Math.round(sessions.reduce((s,e) => s + (e.sets||[]).reduce((a,set) => a + (parseFloat(set.kg)||0)*(parseFloat(set.reps)||0), 0), 0));
    const prs = S.get('prs_' + user, []).slice(-4).reverse();
    const lastSum = S.get('lastWorkoutSummary_' + user, null);

    const pinnedHtml = pinned.length
      ? pinned.map(name => {
          const p = plans[name] || [];
          return `<div class="pinned-plan-card">
            <div class="pinned-plan-top">
              <div><div class="pinned-plan-name">${esc(name)}</div>
              <div class="pinned-plan-meta">${p.length} Tage · ${p.reduce((s,d)=>s+d.ex.length,0)} Übungen</div></div>
              <button class="quick-btn" data-start-plan="${esc(name)}" type="button">Starten</button>
            </div>
          </div>`;
        }).join('')
      : `<div class="empty-state">
          <div class="empty-icon">📌</div>
          <h3>${t('noPlanTitle')}</h3>
          <p>${t('noPlanDesc')}</p>
          <button class="quick-btn" id="home-pin" type="button">${t('pinPlan')}</button>
        </div>`;

    $('home-content').innerHTML = `
      <div class="dashboard-hero">
        <div>
          <div class="dash-greeting">Hi ${esc(user)} 👋</div>
          <div class="dash-sub">${last ? `Zuletzt: ${esc(last.plan)} · ${esc(last.label)} am ${esc(last.date)}` : 'Noch kein Training abgeschlossen.'}</div>
        </div>
        ${next ? `<button class="quick-btn" id="home-start" type="button">${esc(next.label)} →</button>` : ''}
      </div>
      <div class="dash-grid">
        <div class="dash-stat"><strong>${weekCount}</strong><span>Diese Woche</span></div>
        <div class="dash-stat"><strong>${log.length}</strong><span>Gesamt</span></div>
        <div class="dash-stat"><strong>${Math.round(totalVol/1000)}t</strong><span>Volumen</span></div>
      </div>
      <div class="home-section-label">Angeheftete Pläne</div>
      ${pinnedHtml}
      ${lastSum ? `<div class="quick-card"><div class="quick-label">Letztes Training</div>
        <div class="quick-title">${esc(lastSum.plan)} · ${esc(lastSum.label)}</div>
        <div class="quick-sub">${lastSum.exercises} Übungen · ${lastSum.sets} Sätze · ${lastSum.volume}kg</div>
      </div>` : ''}
      ${prs.length ? `<div class="quick-card"><div class="quick-label">Persönliche Rekorde</div>
        ${prs.map(pr => `<div class="pr-row"><span>🏆 ${esc(pr.exercise)}</span><strong>${pr.kg}kg×${pr.reps}</strong></div>`).join('')}
      </div>` : ''}`;

    $('home-start')?.addEventListener('click', () => {
      if (!next || !plans[next.plan]) { setScreen('plans'); return; }
      setPlan(next.plan); setScreen('train');
    });
    $('home-pin')?.addEventListener('click', () => setScreen('plans'));
    document.querySelectorAll('[data-start-plan]').forEach(b =>
      b.addEventListener('click', () => { setPlan(b.dataset.startPlan); setScreen('train'); })
    );
  }

  // ── Training ───────────────────────────────────────────────────────────────
  function renderTraining() {
    // Guard: no plan pinned
    if (!plan || !days || !days[day]) {
      $('train-content').innerHTML = `
        <div class="empty-state" style="padding:70px 20px">
          <div class="empty-icon">📌</div>
          <h3>${t('noPlanTitle')}</h3>
          <p>${t('noPlanDesc')}</p>
          <button class="quick-btn" id="go-plans" type="button">${t('pinPlan')}</button>
        </div>`;
      $('go-plans')?.addEventListener('click', () => setScreen('plans'));
      $('finish-bar-inner').innerHTML = '';
      return;
    }

    const d = days[day];
    const sug = getNextSuggestion(user);
    const last = getLastTraining(user);
    const isActive = sug && sug.plan === plan && sug.dayIndex === day;
    let html = '';

    if (sug) {
      html += `<div class="quick-card suggestion-card">
        <div class="quick-top">
          <div>
            <div class="quick-label">⚡ Vorschlag</div>
            <div class="quick-title">${esc(sug.plan)} · ${esc(sug.label)}</div>
            <div class="quick-sub">${last ? `Zuletzt: ${esc(last.plan)} · ${esc(last.label)} am ${esc(last.date)}` : 'Noch kein Training.'}</div>
          </div>
          ${isActive
            ? '<span class="quick-done">Aktiv ✓</span>'
            : '<button class="quick-btn" id="open-sug" type="button">Öffnen →</button>'
          }
        </div>
      </div>`;
    }

    html += '<div class="sec-lbl">🔥 Warm-Up</div><div class="wu-row">';
    D.WARMUP.forEach(name => {
      const done = !!warmup[name];
      html += `<div class="wu-card ${done?'done':''}" data-wu="${esc(name)}">
        <div class="wu-img"><img src="${esc(imageFor(name))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy"></div>
        <div class="wu-lbl">${done?'✓ ':''}${esc(name)}</div>
        <div class="wu-tick">✓</div>
      </div>`;
    });
    html += `</div><div class="sec-lbl">💪 ${esc(plan)} · ${esc(d.label)}</div>`;
    d.ex.forEach(ex => { html += renderCard(ex); });

    $('train-content').innerHTML = html;
    $('open-sug')?.addEventListener('click', openSuggested);
    document.querySelectorAll('[data-wu]').forEach(el =>
      el.addEventListener('click', () => { warmup[el.dataset.wu] = !warmup[el.dataset.wu]; renderTraining(); })
    );
    renderFinishBar();
  }

  function openSuggested() {
    const s = getNextSuggestion(user);
    if (!s || !plans[s.plan]) { setScreen('plans'); return; }
    plan = s.plan; days = plans[plan]; day = s.dayIndex;
    openExercise = null; warmup = {}; finishConfirm = false;
    renderPlanTabs(); renderDayTabs(); renderTraining();
  }

  // ── Exercise card ──────────────────────────────────────────────────────────
  function renderCard(original) {
    const ex = displayExercise(original);
    const st = styleFor(ex.m);
    const isOpen = openExercise === original.id;
    const isDone = !!S.get(doneKey(original.id), false);
    const hist   = getHistory(original.id).filter(e => e.user === user).slice(-3);
    const last   = hist[hist.length - 1];
    const count  = setCounts[original.id] || 3;

    if (!isOpen) {
      return `<div class="ex-card ${isDone?'edone':''}" id="card_${original.id}">
        <div class="ex-row" data-open="${original.id}">
          <div class="ex-thumb"><img src="${esc(imageFor(ex.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy"></div>
          <div class="ex-info">
            <div class="ex-mtag" style="color:${st.c}">${esc(ex.m)}</div>
            <div class="ex-name">${esc(ex.n)}</div>
            ${last ? `<div class="ex-last">${esc(last.date)} · ${last.sets.map(s=>`${s.kg}×${s.reps}`).join('  ')}</div>` : ''}
          </div>
          <div class="ex-r">
            ${isDone
              ? '<div class="done-chk">✓</div>'
              : `<div class="sets-badge">${count}×</div><div class="chevron">›</div>`
            }
          </div>
        </div>
      </div>`;
    }

    // Build set rows
    let rows = '';
    for (let i = 0; i < count; i++) {
      rows += `<div class="set-row">
        <div class="snum" style="background:${st.bg};color:${st.c}">S${i+1}</div>
        <input class="ninp" type="number" inputmode="decimal" id="kg_${original.id}_${i}"
          value="${inputVal(original.id, i, 'kg')}" placeholder="kg"
          data-setwatch="${original.id}" data-setidx="${i}">
        <input class="ninp" type="number" inputmode="numeric" id="reps_${original.id}_${i}"
          value="${inputVal(original.id, i, 'reps')}" placeholder="Wdh"
          data-setwatch="${original.id}" data-setidx="${i}">
        <button class="del-btn" type="button" data-del="${original.id}" data-delidx="${i}">−</button>
      </div>`;
    }

    const histHtml = hist.length ? `<div class="hist">
      <div class="hist-ttl">Letzte Einheiten</div>
      ${hist.map(e => `<div class="hentry">
        <div class="hdate">${esc(e.date)} · ${esc(e.user)}</div>
        <div class="hpills">${e.sets.map((s,i) =>
          `<span class="hpill" style="background:${st.bg};color:${st.c}">S${i+1} ${s.kg}kg×${s.reps}</span>`
        ).join('')}</div>
      </div>`).join('')}
    </div>` : '';

    // Swap panel — grouped by muscle
    const groups = {};
    getExerciseDB().forEach(item => {
      groups[item.m] = groups[item.m] || [];
      groups[item.m].push(item);
    });
    const swapHtml = Object.keys(groups).map(muscle => `
      <div class="swap-group-label">${esc(muscle)}</div>
      <div class="swap-grid">${groups[muscle].map(item => `
        <div class="swap-card ${item.n===ex.n?'active':''}">
          <img src="${esc(imageFor(item.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
          <div class="swap-card-body">
            <div class="swap-name">${esc(item.n)}</div>
            <button class="swap-select-btn" type="button"
              data-swap-id="${original.id}" data-swap-m="${esc(item.m)}" data-swap-n="${esc(item.n)}">
              ${item.n===ex.n ? '✓ Aktiv' : 'Wählen'}
            </button>
          </div>
        </div>`).join('')}
      </div>`).join('');

    return `<div class="ex-card open ${isDone?'edone':''}" id="card_${original.id}" style="border-color:${st.c}55">
      <div class="ex-hero" data-open="${original.id}">
        <img src="${esc(imageFor(ex.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
        <div class="grad"></div>
        <div class="hbadge" style="background:${st.c}">${esc(ex.m)}</div>
        <div class="hbot"><div class="hname">${esc(ex.n)}</div><div class="hhint">▲ schließen</div></div>
      </div>
      <div class="ex-body">
        <div class="swap-box">
          <button class="swap-toggle" type="button" data-swap-toggle="${original.id}">
            <span>🔄 Übung tauschen</span><span>${swapOpen[original.id]?'−':'+'}</span>
          </button>
          <div class="swap-content ${swapOpen[original.id]?'open':''}">${swapHtml}
            ${ex.swapped?`<button class="swap-reset" data-swap-reset="${original.id}">Zurücksetzen ↺</button>`:''}
          </div>
        </div>
        ${histHtml}
        <div class="inp-ttl">Heute eintragen</div>
        <div class="col-hd"><span></span><span>kg</span><span>Wdh.</span><span></span></div>
        ${rows}
        <div class="rest-row">
          <button class="rest-btn" type="button" data-fill="${original.id}">↩ Letzte Werte</button>
          <button class="rest-btn" type="button" data-detail="${original.id}">📊 Fortschritt</button>
        </div>
        <button class="add-s-btn" type="button" data-addset="${original.id}">+ Satz hinzufügen</button>
        <div class="rest-row">
          <button class="rest-btn" type="button" data-rest="90">⏱ 1:30</button>
          <button class="rest-btn" type="button" data-rest="180">💤 3:00</button>
        </div>
        <button class="save-btn" type="button"
          data-saveex="${original.id}" data-setcount="${count}"
          style="background:${st.c}">${t('setsSaved')} ✓</button>
      </div>
    </div>`;
  }

  // ── Finish bar ─────────────────────────────────────────────────────────────
  function renderFinishBar() {
    const inner = $('finish-bar-inner');
    if (!days || !days[day]) { inner.innerHTML = ''; return; }
    const done  = days[day].ex.filter(ex => S.get(doneKey(ex.id), false)).length;
    const total = days[day].ex.length;
    const allDone = done === total;

    if (finished[day]) {
      inner.innerHTML = `<div class="finish-done-msg">
        <div class="fdm-txt">🎉 ${t('trainingSaved')}, ${esc(user)}!</div>
      </div>`; return;
    }
    if (finishConfirm) {
      inner.innerHTML = `<div class="finish-confirm">
        <div class="finish-confirm-title">${t('confirmFinish')}</div>
        <div class="finish-confirm-note">${allDone ? t('allDone') : t('stillOpen', {n: total-done})}</div>
        <div class="finish-confirm-row">
          <button class="finish-no"  id="fc-no"  type="button">${t('cancel')}</button>
          <button class="finish-yes" id="fc-yes" type="button">${t('yesFinish')}</button>
        </div>
      </div>`;
      $('fc-no').addEventListener('click', () => { finishConfirm = false; renderFinishBar(); });
      $('fc-yes').addEventListener('click', () => {
        const summary = {
          plan, label: days[day].label, date: dateStr(),
          exercises: days[day].ex.filter(ex => S.get(doneKey(ex.id), false)).length,
          sets: 0, volume: 0,
        };
        days[day].ex.forEach(ex => {
          const h = getHistory(ex.id).filter(e=>e.user===user).slice(-1)[0];
          if (!h) return;
          summary.sets += h.sets.length;
          summary.volume += Math.round(h.sets.reduce((s,set)=>s+(parseFloat(set.kg)||0)*(parseFloat(set.reps)||0),0));
        });
        S.set('lastWorkoutSummary_' + user, summary);
        const log = getTrainingLog(user);
        const entry = {plan, dayIndex:day, label:days[day].label, date:dateStr(), ts:Date.now()};
        const prev = log[log.length-1];
        if (!(prev && prev.plan===plan && prev.dayIndex===day && prev.date===entry.date)) {
          log.push(entry); S.set('trainingLog_' + user, log.slice(-100));
        }
        finished[day] = true; finishConfirm = false;
        showToast('🎉 ' + t('trainingSaved') + ', ' + user + '!');
        renderDayTabs(); renderFinishBar();
      });
      return;
    }

    inner.innerHTML = `<button class="finish-btn ${allDone?'ready':''}" id="finish-btn" type="button">
      ${allDone ? '🎉 ' + t('yesFinish') : `Training beenden (${done}/${total})`}
    </button>`;
    $('finish-btn').addEventListener('click', () => {
      saveCurrentInputs(); finishConfirm = true; renderFinishBar();
    });
  }

  // ── Dynamic events ─────────────────────────────────────────────────────────
  function bindDynamic() {
    document.addEventListener('click', e => {
      // Open/close card
      const open = e.target.closest('[data-open]');
      if (open) {
        saveCurrentInputs();
        openExercise = openExercise === open.dataset.open ? null : open.dataset.open;
        renderTraining();
        setTimeout(() => $('card_' + openExercise)?.scrollIntoView({behavior:'smooth',block:'nearest'}), 60);
        return;
      }
      // Add set
      const addset = e.target.closest('[data-addset]');
      if (addset) {
        saveCurrentInputs();
        const id = addset.dataset.addset;
        setCounts[id] = (setCounts[id] || 3) + 1;
        inputs[day] = inputs[day] || {};
        inputs[day][id] = inputs[day][id] || [];
        inputs[day][id].push({kg:'',reps:''});
        renderTraining(); return;
      }
      // Delete set
      const del = e.target.closest('[data-del]');
      if (del) {
        saveCurrentInputs();
        const id = del.dataset.del, idx = Number(del.dataset.delidx);
        if ((setCounts[id]||3) <= 1) return;
        setCounts[id] = (setCounts[id]||3) - 1;
        inputs[day]?.[id]?.splice(idx, 1);
        renderTraining(); return;
      }
      // Save exercise
      const saveex = e.target.closest('[data-saveex]');
      if (saveex) { saveExercise(saveex.dataset.saveex, Number(saveex.dataset.setcount)); return; }
      // Rest timer
      const rest = e.target.closest('[data-rest]');
      if (rest) { startTimer(Number(rest.dataset.rest)); return; }
      // Fill last values
      const fill = e.target.closest('[data-fill]');
      if (fill) { fillLast(fill.dataset.fill); return; }
      // Progress shortcut
      const detail = e.target.closest('[data-detail]');
      if (detail) {
        const ex = displayExercise({id:detail.dataset.detail});
        progressExercise = ex.n || detail.dataset.detail;
        setScreen('progress'); return;
      }
      // Swap select
      const sw = e.target.closest('[data-swap-id]');
      if (sw) {
        daySwaps[swapKey(sw.dataset.swapId)] = {id:sw.dataset.swapId, m:sw.dataset.swapM, n:sw.dataset.swapN, swapped:true};
        openExercise = sw.dataset.swapId; renderTraining(); return;
      }
      // Swap toggle
      const swt = e.target.closest('[data-swap-toggle]');
      if (swt) { swapOpen[swt.dataset.swapToggle] = !swapOpen[swt.dataset.swapToggle]; renderTraining(); return; }
      // Swap reset
      const swr = e.target.closest('[data-swap-reset]');
      if (swr) { delete daySwaps[swapKey(swr.dataset.swapReset)]; openExercise = swr.dataset.swapReset; renderTraining(); return; }
    });

    // Auto-start timer when both kg+reps filled
    document.addEventListener('input', e => {
      const inp = e.target.closest('.ninp[data-setwatch]');
      if (!inp || !openExercise) return;
      const id = inp.dataset.setwatch, idx = inp.dataset.setidx;
      const kg   = $('kg_'   + id + '_' + idx)?.value;
      const reps = $('reps_' + id + '_' + idx)?.value;
      const tkey = plan + '_' + day + '_' + id + '_' + idx;
      if (kg && reps && parseFloat(kg) > 0 && parseFloat(reps) > 0 && !completedSetTimers[tkey]) {
        completedSetTimers[tkey] = true;
        startTimer(90);
      }
      if (!kg || !reps) completedSetTimers[tkey] = false;
      // Also autosave inputs live
      saveCurrentInputs();
    });
  }

  function saveExercise(id, count) {
    saveCurrentInputs();
    const sets = Array.from({length:count}, (_,i) => ({
      kg:   inputs[day]?.[id]?.[i]?.kg   || '0',
      reps: inputs[day]?.[id]?.[i]?.reps || '0',
    }));
    const ex = displayExercise({id, n:id, m:'Brust'});
    // Find actual exercise info
    const exInfo = getExerciseDB().find(e => e.n === (daySwaps[swapKey(id)]?.n || (days[day]?.ex.find(e=>e.id===id)?.n)));
    const entry  = {date:dateStr(), user, sets, exercise:exInfo?.n||id, muscle:exInfo?.m||'Brust', ts:Date.now()};

    // Check PR
    const prev = getHistory(id).filter(e=>e.user===user).flatMap(e=>e.sets)
      .reduce((best,s) => {
        const v = (parseFloat(s.kg)||0)*(parseFloat(s.reps)||0);
        return v > best.v ? {v,kg:s.kg,reps:s.reps} : best;
      }, {v:0,kg:0,reps:0});
    sets.forEach(s => {
      const v = (parseFloat(s.kg)||0)*(parseFloat(s.reps)||0);
      if (parseFloat(s.kg) && parseFloat(s.reps) && v > prev.v) {
        const prs = S.get('prs_'+user,[]);
        prs.push({exercise:entry.exercise, kg:s.kg, reps:s.reps, date:dateStr(), ts:Date.now()});
        S.set('prs_'+user, prs.slice(-80));
        showToast(t('newPR') + entry.exercise + ' · ' + s.kg + 'kg×' + s.reps);
      }
    });

    S.set('h_' + id, [...getHistory(id), entry].slice(-80));
    const sess = S.get('sessions_'+user,[]);
    sess.push({date:dateStr(), day, plan, exercise:entry.exercise, ts:Date.now()});
    S.set('sessions_'+user, sess.slice(-300));
    S.set(doneKey(id), true);
    openExercise = null;
    startTimer(90);
    renderDayTabs(); renderTraining();
  }

  function fillLast(id) {
    const hist = getHistory(id).filter(e=>e.user===user);
    if (!hist.length) { showToast(t('noHistory')); return; }
    const last  = hist[hist.length-1];
    const count = Math.max(setCounts[id]||3, last.sets.length);
    setCounts[id] = count;
    inputs[day] = inputs[day] || {};
    inputs[day][id] = Array.from({length:count}, (_,i) => ({kg:last.sets[i]?.kg||'', reps:last.sets[i]?.reps||''}));
    renderTraining(); showToast(t('fillLast'));
  }

  // ── Rest timer (absolute end time — survives tab switch) ───────────────────
  function startTimer(seconds) {
    clearInterval(window.__restInt);
    window.__restEnd = Date.now() + seconds * 1000;
    $('rest-float').classList.add('show');
    function tick() {
      const rem = Math.max(0, Math.ceil((window.__restEnd - Date.now()) / 1000));
      $('rest-time').textContent = rem <= 0 ? 'Fertig ✓'
        : String(Math.floor(rem/60)).padStart(2,'0') + ':' + String(rem%60).padStart(2,'0');
      if (rem <= 0) {
        clearInterval(window.__restInt);
        if (navigator.vibrate) navigator.vibrate([200,100,200]);
      }
    }
    tick();
    window.__restInt = setInterval(tick, 500);
  }
  // Resync timer display after tab switch
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.__restEnd) {
      const rem = Math.max(0, Math.ceil((window.__restEnd - Date.now()) / 1000));
      if (rem > 0) $('rest-time').textContent =
        String(Math.floor(rem/60)).padStart(2,'0') + ':' + String(rem%60).padStart(2,'0');
    }
  });

  // ── Progress ───────────────────────────────────────────────────────────────
  function renderProgress() {
    const exList = getExerciseDB();
    if (!progressExercise || !exList.find(e=>e.n===progressExercise)) {
      progressExercise = exList[0]?.n || null;
    }
    if (!progressExercise) { $('prog-content').innerHTML = '<div class="empty-state"><p>Keine Übungen.</p></div>'; return; }

    const cur = exList.find(e=>e.n===progressExercise) || exList[0];
    const st  = styleFor(cur.m);
    const ids = Object.values(plans).flatMap(p=>p.flatMap(d=>d.ex)).filter(e=>e.n===progressExercise).map(e=>e.id);
    const hist = ids.flatMap(getHistory).filter(e=>!progressUser||e.user===progressUser);

    // Group exercises by muscle for picker
    const groups = {};
    exList.forEach(ex => { groups[ex.m]=groups[ex.m]||[]; groups[ex.m].push(ex); });

    let html = '<div class="sec-lbl">📊 Übung wählen</div>';
    html += Object.keys(groups).map(m => {
      const ms = styleFor(m);
      return `<details class="prog-group" ${m===cur.m?'open':''}>
        <summary style="color:${ms.c}">${esc(m)}</summary>
        <div class="pill-wrap">${groups[m].map(ex => {
          const active = ex.n === progressExercise;
          return `<button class="pill" data-pex="${esc(ex.n)}" type="button"
            style="background:${active?ms.bg:'var(--card2)'};color:${active?ms.c:'var(--muted)'};border-color:${active?ms.c+'55':'transparent'}">
            ${esc(ex.n)}</button>`;
        }).join('')}</div>
      </details>`;
    }).join('');

    html += `<div class="hero-card" style="border-color:${st.c}33">
      <div class="hero-img">
        <img src="${esc(imageFor(progressExercise))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
        <div class="hgrad"></div>
        <div class="hero-info">
          <div class="hbadge2" style="background:${st.c}">${esc(cur.m)}</div>
          <div class="hname2">${esc(progressExercise)}</div>
        </div>
      </div>`;

    if (hist.length) {
      const maxKg   = Math.max(...hist.flatMap(e=>e.sets.map(s=>parseFloat(s.kg)||0)));
      const maxReps = Math.max(...hist.flatMap(e=>e.sets.map(s=>parseFloat(s.reps)||0)));
      const vol     = Math.round(hist.reduce((s,e)=>s+(e.sets||[]).reduce((a,set)=>a+(parseFloat(set.kg)||0)*(parseFloat(set.reps)||0),0),0));
      html += `<div class="stats-row">
        <div class="stat"><div class="stat-val" style="color:${st.c}">${hist.length}</div><div class="stat-lbl">Einheiten</div></div>
        <div class="stat"><div class="stat-val" style="color:${st.c}">${maxKg}kg</div><div class="stat-lbl">Max kg</div></div>
        <div class="stat"><div class="stat-val" style="color:${st.c}">${vol}</div><div class="stat-lbl">Volumen</div></div>
      </div>`;
    }
    html += '</div>';

    if (!hist.length) {
      $('prog-content').innerHTML = html + '<div class="empty-state"><h3>Noch keine Daten</h3><p>Trage eine Einheit ein.</p></div>';
      $('prog-content').querySelectorAll('[data-pex]').forEach(b=>b.addEventListener('click',()=>{progressExercise=b.dataset.pex;renderProgress();}));
      return;
    }

    const labels   = hist.map(h=>h.date);
    const kgData   = hist.map(h=>avg(h.sets.map(s=>parseFloat(s.kg)||0)));
    const repsData = hist.map(h=>avg(h.sets.map(s=>parseFloat(s.reps)||0)));

    html += '<div class="chart-box"><div class="chart-lbl">Ø Gewicht (kg)</div><canvas id="cKg"></canvas></div>';
    html += '<div class="chart-box"><div class="chart-lbl">Ø Wiederholungen</div><canvas id="cRp"></canvas></div>';
    html += '<div class="sec-lbl">Verlauf</div>';
    html += [...hist].reverse().map(e => `<div class="log-entry">
      <div class="log-top"><span class="log-d" style="color:${st.c}">${e.date}</span><span class="log-u">${esc(e.user)}</span></div>
      <div class="log-pills">${e.sets.map((s,i)=>`<span class="lpill" style="background:${st.bg};color:${st.c}">S${i+1}: ${s.kg}kg×${s.reps}</span>`).join('')}</div>
    </div>`).join('');

    $('prog-content').innerHTML = html;
    $('prog-content').querySelectorAll('[data-pex]').forEach(b=>b.addEventListener('click',()=>{progressExercise=b.dataset.pex;renderProgress();}));

    function mkChart(key, canvas, labels, data, color, unit) {
      if (!window.Chart||!canvas) return;
      if (charts[key]) charts[key].destroy();
      charts[key] = new Chart(canvas, {
        type:'line',
        data:{labels,datasets:[{data,borderColor:color,backgroundColor:color+'22',borderWidth:2.5,pointRadius:4,pointBackgroundColor:color,tension:.35,fill:true}]},
        options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>String(ctx.parsed.y)+unit}}},
          scales:{x:{ticks:{color:'#888',font:{size:10}},grid:{color:'rgba(255,255,255,.05)'}},
                  y:{ticks:{color:'#888',font:{size:10}},grid:{color:'rgba(255,255,255,.05)'}}}}
      });
    }
    mkChart('kg',   $('cKg'), labels, kgData,   st.c,       'kg');
    mkChart('reps', $('cRp'), labels, repsData, '#ff9f0a',  '');
  }

  // ── Plan builder ───────────────────────────────────────────────────────────
  function renderPlanBuilder() {
    const pinned  = new Set(getPinnedPlans());
    const basePlanNames = Object.keys(D.BASE_PLANS);

    // Exercise picker HTML (grouped)
    function exPicker(id) {
      const groups = {};
      getExerciseDB().forEach(ex => { groups[ex.m]=groups[ex.m]||[]; groups[ex.m].push(ex); });
      return `<select class="builder-select" id="${id}">
        ${Object.keys(groups).map(m =>
          `<optgroup label="${esc(m)}">${groups[m].map(ex=>`<option value="${esc(ex.m)}|${esc(ex.n)}">${esc(ex.n)}</option>`).join('')}</optgroup>`
        ).join('')}
      </select>`;
    }

    let html = `<div class="builder-card">
      <div class="builder-title">📚 Planbibliothek</div>
      <div class="builder-sub">Hefte Pläne an, bearbeite oder erstelle eigene.</div>
    </div>`;

    // Library list
    Object.keys(plans).forEach(name => {
      const p = plans[name] || [];
      const isBase = basePlanNames.includes(name);
      const isPinned = pinned.has(name);
      html += `<div class="plan-lib-card">
        <div class="plan-lib-head">
          <div>
            ${isPinned ? '<span class="pinned-tag">📌 Angeheftet</span>' : ''}
            <div class="plan-lib-name">${esc(name)}</div>
            <div class="plan-lib-meta">${p.length} Tage · ${p.reduce((s,d)=>s+d.ex.length,0)} Übungen${isBase?' · Vorlage':''}</div>
          </div>
          <button class="pin-btn ${isPinned?'active':''}" data-pin="${esc(name)}" type="button">
            ${isPinned ? 'Lösen' : 'Anheften'}
          </button>
        </div>
        <div class="builder-row" style="margin-top:10px">
          <button class="builder-btn secondary" data-dup="${esc(name)}" type="button">Duplizieren</button>
          ${isBase
            ? `<button class="builder-btn secondary" data-copy="${esc(name)}" type="button">Kopie bearbeiten</button>`
            : `<button class="builder-btn secondary" data-edit="${esc(name)}" type="button">Bearbeiten</button>`
          }
        </div>
        ${!isBase ? `<button class="builder-btn danger" data-delplan="${esc(name)}" type="button" style="width:100%;margin-top:8px">Plan löschen</button>` : ''}
      </div>`;
    });

    // New plan section
    html += `<div class="builder-card">
      <div class="builder-title">➕ Neuen Plan</div>
      <input class="builder-input" id="builder-name" placeholder="Name des Plans" value="${esc(planDraft?.name||'')}">
      <div class="builder-row">
        <button class="builder-btn" id="btn-blank" type="button">Leer starten</button>
        <button class="builder-btn secondary" id="btn-addday" type="button">+ Tag hinzufügen</button>
      </div>
      <div style="font-size:11px;color:var(--muted);margin:8px 0 4px">oder Vorlage kopieren:</div>
      <select class="builder-select" id="tpl-select">
        ${Object.keys(plans).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}
      </select>
      <button class="builder-btn secondary" id="btn-copy-tpl" type="button">Vorlage kopieren</button>
    </div>`;

    // Custom exercise creator
    html += `<div class="builder-card">
      <div class="builder-title">💪 Eigene Übung</div>
      <div class="builder-sub">Füge eine Übung zur Datenbank hinzu.</div>
      <select class="builder-select" id="cex-muscle">
        ${Object.keys(D.STYLE).map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}
      </select>
      <input class="builder-input" id="cex-name" placeholder="Übungsname" maxlength="50">
      <input class="builder-input" id="cex-url" placeholder="Bild-URL (optional)">
      <div class="file-upload-row">
        <label class="file-upload-btn" for="cex-file">📷 Bild hochladen</label>
        <input id="cex-file" type="file" accept="image/*" style="display:none">
        <span id="cex-file-name" class="file-name-hint"></span>
      </div>
      <button class="builder-btn" id="cex-save" type="button" style="width:100%;margin-top:8px">Übung speichern</button>
    </div>`;

    // Draft editor
    if (planDraft) {
      html += `<div class="builder-card draft-active">
        <span class="custom-pill">✏️ Entwurf aktiv</span>
        <div class="builder-title">${esc(planDraft.name || 'Neuer Plan')}</div>
        <button class="builder-btn" id="save-draft" type="button" style="width:100%">Plan speichern ✓</button>
      </div>`;
      html += planDraft.days.map((d, di) => `
        <div class="day-builder">
          <div class="day-builder-head">
            <input class="builder-input" data-day-label="${di}" value="${esc(d.label)}" style="margin:0;flex:1">
            <button class="builder-mini" data-rmday="${di}" type="button" title="Tag entfernen">×</button>
          </div>
          ${d.ex.length
            ? d.ex.map((ex,ei) => `<div class="builder-ex">
                <img src="${esc(imageFor(ex.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
                <div class="builder-ex-info">
                  <div class="builder-ex-muscle" style="color:${styleFor(ex.m).c}">${esc(ex.m)}</div>
                  <div class="builder-ex-name">${esc(ex.n)}</div>
                </div>
                <button class="builder-mini" data-mvup="${di}|${ei}" title="Nach oben">↑</button>
                <button class="builder-mini" data-mvdn="${di}|${ei}" title="Nach unten">↓</button>
                <button class="builder-mini" data-rmex="${di}|${ei}" title="Entfernen" style="color:var(--red)">×</button>
              </div>`).join('')
            : '<div class="builder-empty">Noch keine Übungen.</div>'
          }
          ${exPicker('addex-' + di)}
          <button class="builder-btn secondary" data-addex="${di}" type="button">+ Übung hinzufügen</button>
        </div>`).join('');
    }

    $('plan-content').innerHTML = html;
    bindBuilderEvents();
  }

  function bindBuilderEvents() {
    const name = () => ($('builder-name')?.value || '').trim() || 'Mein Plan';

    $('btn-blank')?.addEventListener('click', () => {
      planDraft = {name:name(), days:[{label:'Tag 1', ex:[]}]};
      renderPlanBuilder();
    });
    $('btn-addday')?.addEventListener('click', () => {
      if (!planDraft) planDraft = {name:name(), days:[]};
      planDraft.days.push({label:'Tag '+(planDraft.days.length+1), ex:[]});
      renderPlanBuilder();
    });
    $('btn-copy-tpl')?.addEventListener('click', () => {
      const tpl = $('tpl-select')?.value;
      planDraft = {name:name(), days:clone(plans[tpl]||plans[Object.keys(plans)[0]])};
      renderPlanBuilder();
    });
    $('builder-name')?.addEventListener('input', e => { if(planDraft) planDraft.name=e.target.value.trim()||'Plan'; });
    $('save-draft')?.addEventListener('click', saveDraft);

    // Custom exercise save
    $('cex-file')?.addEventListener('change', e => {
      $('cex-file-name').textContent = e.target.files[0]?.name || '';
    });
    $('cex-save')?.addEventListener('click', () => {
      const muscle = $('cex-muscle')?.value || 'Brust';
      const exName = ($('cex-name')?.value||'').trim();
      const url    = ($('cex-url')?.value||'').trim();
      const file   = $('cex-file')?.files[0];
      if (!exName) { showToast(t('nameRequired')); return; }
      const doSave = img => {
        const items = getCustomExercises();
        const existing = items.find(e=>e.n===exName);
        if (existing) { if(img) existing.image=img; }
        else items.push({m:muscle, n:exName, image:img||''});
        saveCustomExercises(items);
        if (img) D.IMAGES[exName] = img;
        loadPlans(); showToast(t('exerciseSaved'));
        if (window.GBCloudSync) window.GBCloudSync.push(true);
        renderPlanBuilder();
      };
      if (file) {
        if (window.GBCloudSync?.uploadImage) {
          window.GBCloudSync.uploadImage(file, exName).then(pubUrl => {
            if (pubUrl) doSave(pubUrl);
            else { const r=new FileReader(); r.onload=()=>doSave(r.result); r.readAsDataURL(file); }
          });
        } else { const r=new FileReader(); r.onload=()=>doSave(r.result); r.readAsDataURL(file); }
      } else doSave(url);
    });

    // Library buttons
    document.querySelectorAll('[data-pin]').forEach(b => b.addEventListener('click', () => {
      setPinned(b.dataset.pin, !getPinnedPlans().includes(b.dataset.pin));
      renderPlanBuilder(); renderPlanTabs();
    }));
    document.querySelectorAll('[data-dup]').forEach(b => b.addEventListener('click', () => {
      planDraft={name:b.dataset.dup+' Copy', days:clone(plans[b.dataset.dup])};
      renderPlanBuilder();
    }));
    document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      planDraft={name:b.dataset.edit, days:clone(plans[b.dataset.edit])};
      renderPlanBuilder();
    }));
    document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
      planDraft={name:b.dataset.copy+' Custom', days:clone(plans[b.dataset.copy])};
      renderPlanBuilder();
    }));
    document.querySelectorAll('[data-delplan]').forEach(b => b.addEventListener('click', () => {
      if (!confirm('Plan "' + b.dataset.delplan + '" löschen?')) return;
      delete plans[b.dataset.delplan];
      if (plan===b.dataset.delplan) { plan=null; days=[]; }
      saveCustomPlans(); renderPlanBuilder(); renderPlanTabs();
    }));

    // Draft editing
    document.querySelectorAll('[data-day-label]').forEach(el =>
      el.addEventListener('input', () => { planDraft.days[Number(el.dataset.dayLabel)].label = el.value.trim()||'Tag'; })
    );
    document.querySelectorAll('[data-addex]').forEach(b => b.addEventListener('click', () => {
      const di  = Number(b.dataset.addex);
      const val = $('addex-'+di)?.value||'';
      const [m,n] = val.split('|');
      if (!n) return;
      planDraft.days[di].ex.push({id:'c_'+Date.now()+'_'+Math.random().toString(36).slice(2), m, n});
      renderPlanBuilder();
    }));
    document.querySelectorAll('[data-rmday]').forEach(b => b.addEventListener('click', () => {
      planDraft.days.splice(Number(b.dataset.rmday),1);
      if (!planDraft.days.length) planDraft.days.push({label:'Tag 1',ex:[]});
      renderPlanBuilder();
    }));
    document.querySelectorAll('[data-rmex]').forEach(b => b.addEventListener('click', () => {
      const [di,ei]=b.dataset.rmex.split('|').map(Number);
      planDraft.days[di].ex.splice(ei,1); renderPlanBuilder();
    }));
    document.querySelectorAll('[data-mvup]').forEach(b => b.addEventListener('click', () => {
      const [di,ei]=b.dataset.mvup.split('|').map(Number);
      if (ei<=0) return;
      const arr=planDraft.days[di].ex; [arr[ei-1],arr[ei]]=[arr[ei],arr[ei-1]]; renderPlanBuilder();
    }));
    document.querySelectorAll('[data-mvdn]').forEach(b => b.addEventListener('click', () => {
      const [di,ei]=b.dataset.mvdn.split('|').map(Number);
      const arr=planDraft.days[di].ex; if (ei>=arr.length-1) return;
      [arr[ei+1],arr[ei]]=[arr[ei],arr[ei+1]]; renderPlanBuilder();
    }));
  }

  function saveDraft() {
    if (!planDraft) return;
    const name = (planDraft.name||'').trim()||'Mein Plan';
    if (!planDraft.days.some(d=>d.ex.length)) { showToast(t('atLeastOneEx')); return; }
    plans[name] = clone(planDraft.days);
    saveCustomPlans();
    setPinned(name, true);
    plan=name; days=plans[name]; day=0; planDraft=null;
    renderPlanTabs(); renderDayTabs(); setScreen('train');
    showToast(t('planSaved'));
    if (window.GBCloudSync) window.GBCloudSync.push(true);
  }

  // ── Settings ───────────────────────────────────────────────────────────────
  function getTheme()    { return S.get('theme_' + user, S.get('theme_default','dark')); }
  function setTheme(th)  { S.set('theme_' + user, th); S.set('theme_default', th); applySavedTheme(); renderSettings(); }
  function applySavedTheme() { document.body.classList.toggle('light-mode', getTheme()==='light'); }

  function renderSettings() {
    const theme = getTheme();
    const lang  = currentLang;
    const users = getUsers();
    const configured = !!(window.GBCloudSync?.isConfigured?.());

    $('settings-content').innerHTML = `
      <div class="settings-card">
        <div class="settings-title">${t('settingsTitle')}</div>
        <div class="quick-label" style="margin-top:10px">${t('designLabel')}</div>
        <div class="theme-row">
          <button class="theme-btn ${theme==='dark'?'active':''}" id="s-dark" type="button">${t('dark')}</button>
          <button class="theme-btn ${theme==='light'?'active':''}" id="s-light" type="button">${t('light')}</button>
        </div>
        <div class="quick-label" style="margin-top:14px">${t('langLabel')}</div>
        <div class="theme-row">
          <button class="theme-btn ${lang==='de'?'active':''}" id="l-de" type="button">🇩🇪 Deutsch</button>
          <button class="theme-btn ${lang==='en'?'active':''}" id="l-en" type="button">🇬🇧 English</button>
          <button class="theme-btn ${lang==='th'?'active':''}" id="l-th" type="button">🇹🇭 ภาษาไทย</button>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-title">${t('cloudLabel')}</div>
        <div class="cloud-status-row">
          <span class="cloud-dot" style="background:${configured?'var(--green)':'var(--orange)'}"></span>
          <span id="cloud-status-text">${configured ? t('cloudConnected') : t('cloudOffline')}</span>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-title">💪 ${t('exerciseDBLabel')}</div>
        <button class="settings-action" id="open-exdb" type="button" style="width:100%;margin-top:8px">${t('exerciseDBLabel')}</button>
      </div>

      <div class="settings-card">
        <div class="settings-title">${t('profilesLabel')}</div>
        ${users.map((u,i) => {
          const c = colorFor(i);
          return `<div class="profile-row">
            <div class="avatar" style="background:${c.bg};color:${c.c};width:34px;height:34px;font-size:14px">${initial(u)}</div>
            <div class="profile-row-name">${esc(u)}</div>
            ${u===user
              ? '<span class="profile-active-tag">Aktiv</span>'
              : `<button class="builder-btn danger profile-del-btn" data-deluser="${esc(u)}" type="button">${t('deleteProfile')}</button>`
            }
          </div>`;
        }).join('')}
      </div>`;

    $('s-dark').addEventListener('click',  () => setTheme('dark'));
    $('s-light').addEventListener('click', () => setTheme('light'));
    $('l-de').addEventListener('click', () => { currentLang='de'; S.set('lang','de'); showToast(t('langSaved')); renderSettings(); });
    $('l-en').addEventListener('click', () => { currentLang='en'; S.set('lang','en'); showToast(t('langSaved')); renderSettings(); });
    $('l-th').addEventListener('click', () => { currentLang='th'; S.set('lang','th'); showToast(t('langSaved')); renderSettings(); });
    $('open-exdb').addEventListener('click', renderExerciseEditor);

    // Profile delete — two-click confirm
    document.querySelectorAll('[data-deluser]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.confirmed === '1') {
          const name = btn.dataset.deluser;
          const msg = t('deleteConfirm', {name});
          if (!confirm(msg)) return;
          saveUsers(getUsers().filter(u=>u!==name));
          showToast(t('profileDeleted'));
          if (window.GBCloudSync) window.GBCloudSync.push(true);
          renderSettings(); renderUserScreen();
        } else {
          btn.dataset.confirmed = '1';
          btn.textContent = '⚠️ Wirklich löschen?';
          btn.style.background = 'rgba(255,59,48,.25)';
          setTimeout(() => { btn.dataset.confirmed='0'; btn.textContent=t('deleteProfile'); btn.style.background=''; }, 3000);
        }
      });
    });
  }

  // ── Exercise DB editor (in settings) ──────────────────────────────────────
  function renderExerciseEditor() {
    const allEx = getExerciseDB();
    const groups = {};
    allEx.forEach(ex => { groups[ex.m]=groups[ex.m]||[]; groups[ex.m].push(ex); });

    let html = `<div class="settings-card">
      <button class="builder-btn secondary" id="back-settings" type="button" style="margin-bottom:14px">${t('back')}</button>
      <div class="settings-title">💪 ${t('exerciseDBLabel')}</div>
      <!-- Add new -->
      <div class="custom-ex-section">
        <div class="quick-label" style="margin:12px 0 8px">${t('addExercise')}</div>
        <select class="builder-select" id="edb-muscle">
          ${Object.keys(D.STYLE).map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}
        </select>
        <input class="builder-input" id="edb-name" placeholder="Übungsname" maxlength="50">
        <input class="builder-input" id="edb-url" placeholder="Bild-URL (optional)">
        <div class="file-upload-row">
          <label class="file-upload-btn" for="edb-file">📷 Hochladen</label>
          <input id="edb-file" type="file" accept="image/*" style="display:none">
          <span id="edb-fname" class="file-name-hint"></span>
        </div>
        <button class="builder-btn" id="edb-add" type="button" style="width:100%;margin-top:8px">${t('addExercise')}</button>
      </div>
    </div>`;

    Object.keys(groups).forEach(muscle => {
      const st = styleFor(muscle);
      html += `<details class="edb-group" open>
        <summary style="color:${st.c}">${esc(muscle)}</summary>
        ${groups[muscle].map(ex => `
          <div class="builder-ex edb-ex-row">
            <img src="${esc(imageFor(ex.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"
              style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0">
            <div class="builder-ex-info" style="flex:1;min-width:0">
              <input class="builder-input" data-rename-from="${esc(ex.n)}"
                value="${esc(ex.n)}" style="margin:0;min-height:38px;font-size:13px">
            </div>
            <input type="file" accept="image/*" id="edbf_${esc(ex.n).replace(/\W/g,'_')}"
              style="display:none" data-img-for="${esc(ex.n)}">
            <button class="builder-mini" data-img-btn="${esc(ex.n)}" type="button" title="Bild">🖼</button>
            <button class="builder-mini" data-del-ex="${esc(ex.n)}" type="button"
              title="Löschen" style="color:var(--red)">×</button>
          </div>`).join('')}
      </details>`;
    });

    $('settings-content').innerHTML = html;
    $('back-settings').addEventListener('click', renderSettings);
    $('edb-file').addEventListener('change', e => { $('edb-fname').textContent = e.target.files[0]?.name||''; });

    // Add new exercise
    $('edb-add').addEventListener('click', () => {
      const muscle = $('edb-muscle').value;
      const name   = ($('edb-name').value||'').trim();
      const url    = ($('edb-url').value||'').trim();
      const file   = $('edb-file').files[0];
      if (!name) { showToast(t('nameRequired')); return; }
      const doSave = img => {
        const items = getCustomExercises();
        if (!items.find(e=>e.n===name)) items.push({m:muscle,n:name,image:img||''});
        saveCustomExercises(items);
        if (img) D.IMAGES[name] = img;
        loadPlans(); showToast(t('exerciseSaved'));
        if (window.GBCloudSync) window.GBCloudSync.push(true);
        renderExerciseEditor();
      };
      if (file) {
        if (window.GBCloudSync?.uploadImage) {
          window.GBCloudSync.uploadImage(file, name).then(u => {
            if (u) doSave(u); else { const r=new FileReader(); r.onload=()=>doSave(r.result); r.readAsDataURL(file); }
          });
        } else { const r=new FileReader(); r.onload=()=>doSave(r.result); r.readAsDataURL(file); }
      } else doSave(url);
    });

    // Image upload buttons
    document.querySelectorAll('[data-img-btn]').forEach(btn => {
      const n    = btn.dataset.imgBtn;
      const inp  = document.getElementById('edbf_' + n.replace(/\W/g,'_'));
      btn.addEventListener('click', () => inp?.click());
      inp?.addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const doImg = url => {
          const items = getCustomExercises();
          const ex = items.find(e=>e.n===n);
          if (ex) ex.image=url; else items.push({m:'Brust',n,image:url});
          saveCustomExercises(items); D.IMAGES[n]=url;
          if (window.GBCloudSync) window.GBCloudSync.push(true);
          showToast(t('imageSaved')); renderExerciseEditor();
        };
        if (window.GBCloudSync?.uploadImage) {
          window.GBCloudSync.uploadImage(f,n).then(u=>{
            if(u) doImg(u); else { const r=new FileReader(); r.onload=()=>doImg(r.result); r.readAsDataURL(f); }
          });
        } else { const r=new FileReader(); r.onload=()=>doImg(r.result); r.readAsDataURL(f); }
      });
    });

    // Rename
    document.querySelectorAll('[data-rename-from]').forEach(inp => {
      inp.addEventListener('change', () => {
        const oldName = inp.dataset.renameFrom;
        const newName = inp.value.trim();
        if (!newName || newName===oldName) return;
        const items = getCustomExercises();
        const ex = items.find(e=>e.n===oldName);
        if (ex) ex.n=newName; else items.push({m:'Brust',n:newName});
        saveCustomExercises(items);
        if (D.IMAGES[oldName]) { D.IMAGES[newName]=D.IMAGES[oldName]; delete D.IMAGES[oldName]; }
        loadPlans();
        if (window.GBCloudSync) window.GBCloudSync.push(true);
        showToast(t('renamedTo')); inp.dataset.renameFrom=newName;
      });
    });

    // Delete exercise
    document.querySelectorAll('[data-del-ex]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.delEx;
        if (!confirm('Übung "' + name + '" löschen?')) return;
        saveCustomExercises(getCustomExercises().filter(e=>e.n!==name));
        D.EXERCISE_DB = (D.EXERCISE_DB||[]).filter(e=>e.n!==name);
        loadPlans();
        if (window.GBCloudSync) window.GBCloudSync.push(true);
        showToast(t('exerciseDeleted')); renderExerciseEditor();
      });
    });
  }

  // ── Account menu ───────────────────────────────────────────────────────────
  function toggleMenu() { $('account-menu')?.classList.toggle('show'); }
  function closeMenu()  { $('account-menu')?.classList.remove('show'); }

  // ── Init ───────────────────────────────────────────────────────────────────
  function migrateLegacy() {
    const users = getUsers();
    const old = S.get('pinnedPlans', null);
    if (Array.isArray(old) && users.length) {
      users.forEach(n => { if (!S.get('pinnedPlans_'+n,null)) S.set('pinnedPlans_'+n,old); });
      S.remove('pinnedPlans');
    }
  }

  function init() {
    currentLang = S.get('lang','de');
    loadPlans();
    migrateLegacy();
    applySavedTheme();
    renderUserScreen();
    bindDynamic();

    const inp = $('new-user-inp'), add = $('add-user-btn');
    const upd = () => add.classList.toggle('ready', !!inp.value.trim());
    inp.addEventListener('input', upd);
    inp.addEventListener('keydown', e => { if(e.key==='Enter') addUser(); });
    add.addEventListener('click', addUser);
    add.addEventListener('touchend', e => { e.preventDefault(); addUser(); }, {passive:false});

    $('top-profile-menu').addEventListener('click', toggleMenu);
    $('menu-settings').addEventListener('click', () => { closeMenu(); setScreen('settings'); });
    $('menu-profile-switch').addEventListener('click', () => { closeMenu(); goUsers(); });
    $('menu-close').addEventListener('click', closeMenu);
    document.addEventListener('click', e => {
      if (!e.target.closest('#account-menu') && !e.target.closest('#top-profile-menu')) closeMenu();
    });
    $('tab-home').addEventListener('click', () => setScreen('home'));
    $('tab-train').addEventListener('click', () => setScreen('train'));
    $('tab-progress').addEventListener('click', () => setScreen('progress'));
    $('top-plans').addEventListener('click', () => setScreen('plans'));
    $('rest-close').addEventListener('click', () => {
      clearInterval(window.__restInt); window.__restEnd=null;
      $('rest-float').classList.remove('show');
    });
    upd();

    // Expose remote sync hook for cloud-sync.js
    D.onRemoteSync = () => {
      loadPlans();
      renderUserScreen();
      renderPlanTabs();
      if      (screen==='home')     renderDashboard();
      else if (screen==='train')    renderTraining();
      else if (screen==='progress') renderProgress();
      else if (screen==='plans')    renderPlanBuilder();
      else if (screen==='settings') renderSettings();
    };

    // Sanity checks (no console.assert for WebView compat)
    try {
      if (!Object.keys(plans).length) console.warn('GymBaddies: no plans loaded');
      if (!D.EXERCISE_DB?.length)     console.warn('GymBaddies: empty exercise DB');
    } catch {}
  }

  document.addEventListener('DOMContentLoaded', init);
}());
