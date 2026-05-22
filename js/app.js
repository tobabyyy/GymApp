(function () {
  'use strict';
  const S = window.GBStore;
  const D = window.GB;
  let plans = {};
  let allExercises = [];
  let plan = 'Ganzkoerper';
  let days = [];
  let day = 0;
  let screen = 'home';
  let user = null;
  let warmup = {};
  let openExercise = null;
  let inputs = {};
  let setCounts = {};
  let finished = {};
  let progressExercise = 'Butterfly';
  let progressUser = null;
  let charts = {};
  let planDraft = null;
  let daySwaps = {};
  let swapOpen = {};
  let finishConfirm = false;
  let completedSetTimers = {};

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const styleFor = (muscle) => D.STYLE[muscle] || D.STYLE.Brust;
  function getCustomExercises() { return S.get('customExercises', []); }
  function saveCustomExercises(items) { S.set('customExercises', items); }
  function autoImage(name, muscle) {
    const st = (D.STYLE && D.STYLE[muscle]) || D.STYLE.Brust;
    const safeName = esc(name);
    const safeMuscle = esc(muscle || 'Training');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><rect width="900" height="560" fill="#111"/><rect x="44" y="44" width="812" height="472" rx="42" fill="${st.bg}" stroke="rgba(255,255,255,.18)"/><circle cx="450" cy="188" r="54" fill="none" stroke="${st.c}" stroke-width="18"/><path d="M314 305 C360 248 540 248 586 305" fill="none" stroke="${st.c}" stroke-width="22" stroke-linecap="round"/><path d="M365 316 L322 408 M535 316 L578 408 M414 310 L392 432 M486 310 L508 432" stroke="#f8f8f8" stroke-width="20" stroke-linecap="round"/><text x="450" y="496" text-anchor="middle" fill="#fff" font-family="Arial" font-size="42" font-weight="900">${safeName}</text><text x="450" y="530" text-anchor="middle" fill="${st.c}" font-family="Arial" font-size="17" font-weight="900" letter-spacing="5">${safeMuscle.toUpperCase()}</text></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }
  function customImageMap() { const map = {}; getCustomExercises().forEach((item) => { map[item.n] = item.image || autoImage(item.n, item.m); }); return map; }
  const imageFor = (name) => customImageMap()[name] || D.IMAGES[name] || D.FALLBACK_IMG;
  const initial = (name) => String(name || '?').charAt(0).toUpperCase();
  const colorFor = (index) => D.COLORS[index % D.COLORS.length];
  const dateStr = () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

  function getExerciseDB() {
    const combined = D.EXERCISE_DB.concat(getCustomExercises());
    const seen = new Set();
    return combined.filter((item) => {
      const key = item.m + '|' + item.n;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => (a.m + a.n).localeCompare(b.m + b.n, 'de'));
  }
  function userKey(prefix, name = user) { return prefix + '_' + String(name || 'guest'); }
  function getPinnedPlans(name = user) {
    const saved = S.get(userKey('pinnedPlans', name), null);
    if (Array.isArray(saved)) return saved.filter((planName) => plans[planName]);
    return [];
  }
  function setPinned(name, pinned) {
    const current = new Set(getPinnedPlans(user));
    if (pinned) current.add(name); else current.delete(name);
    const next = Array.from(current).filter((item) => plans[item]);
    S.set(userKey('pinnedPlans'), next);
  }

  function migrateLegacyScopedSettings() {
    const users = getUsers();
    const oldPinned = S.get('pinnedPlans', null);
    if (Array.isArray(oldPinned) && users.length) {
      users.forEach((name) => { if (!S.get(userKey('pinnedPlans', name), null)) S.set(userKey('pinnedPlans', name), oldPinned); });
      S.remove('pinnedPlans');
    }
    const oldTheme = S.get('theme', null);
    if (oldTheme) {
      if (!S.get('theme_default', null)) S.set('theme_default', oldTheme);
      users.forEach((name) => { if (!S.get(userKey('theme', name), null)) S.set(userKey('theme', name), oldTheme); });
      S.remove('theme');
    }
  }

  function loadPlans() {
    plans = Object.assign({}, D.BASE_PLANS, S.get('customPlans', {}));
    days = plans[plan] || plans.Ganzkoerper;
    allExercises = Array.from(new Map(Object.values(plans).flatMap((p) => p.flatMap((d) => d.ex)).map((e) => [e.n, e])).values());
    getCustomExercises().forEach((ex) => { if (!allExercises.some((item) => item.n === ex.n)) allExercises.push({ id: 'custom_db_' + ex.n, m: ex.m, n: ex.n }); });
  }
  function saveCustomPlans() {
    const base = Object.keys(D.BASE_PLANS);
    const custom = {};
    Object.keys(plans).forEach((name) => { if (!base.includes(name)) custom[name] = plans[name]; });
    S.set('customPlans', custom);
    loadPlans();
  }
  function getUsers() { return S.get('users', []); }
  function saveUsers(users) { S.set('users', users); }
  function getHistory(id) { return S.get('h_' + id, []); }
  function getTrainingLog(name) { return S.get('trainingLog_' + name, []); }
  function getLastTraining(name) { const log = getTrainingLog(name); return log.length ? log[log.length - 1] : null; }
  function getNextSuggestion(name) {
    const last = getLastTraining(name);
    if (!last || !plans[last.plan]) return { plan: 'Ganzkoerper', dayIndex: 0, label: plans.Ganzkoerper[0].label };
    const next = ((Number(last.dayIndex) || 0) + 1) % plans[last.plan].length;
    return { plan: last.plan, dayIndex: next, label: plans[last.plan][next].label };
  }

  function buildDayWorkoutSummary() {
    const doneExercises = days[day].ex.filter((ex) => S.get(doneKey(ex.id), false));
    let sets = 0;
    let volume = 0;
    doneExercises.forEach((ex) => {
      const latest = getHistory(ex.id).filter((entry) => entry.user === user).slice(-1)[0];
      if (!latest) return;
      sets += latest.sets.length;
      volume += latest.sets.reduce((sum, set) => sum + ((parseFloat(set.kg) || 0) * (parseFloat(set.reps) || 0)), 0);
    });
    return { plan, label: days[day].label, exercises: doneExercises.length, sets, volume: Math.round(volume), date: dateStr(), ts: Date.now() };
  }

  function recordCompletedTraining() {
    if (!user || !days[day]) return;
    const entry = { plan, dayIndex: day, label: days[day].label, date: dateStr(), ts: Date.now() };
    const log = getTrainingLog(user);
    const last = log[log.length - 1];
    if (!(last && last.plan === entry.plan && last.dayIndex === entry.dayIndex && last.date === entry.date)) {
      log.push(entry);
      S.set('trainingLog_' + user, log.slice(-100));
    }
  }
  function swapKey(id) { return plan + '_' + day + '_' + id; }
  function displayExercise(ex) { return daySwaps[swapKey(ex.id)] || ex; }
  function doneKey(id) { return 'done_' + user + '_' + plan + '_' + day + '_' + dateStr() + '_' + id; }

  function showToast(message) {
    const toast = $('app-toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function renderUserScreen() {
    const users = getUsers();
    const list = $('user-list');
    list.innerHTML = '';
    if (!users.length) {
      list.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px 0;font-size:14px">Noch keine Profile vorhanden.</div>';
      return;
    }
    users.forEach((name, index) => {
      const c = colorFor(index);
      const sessions = S.get('sessions_' + name, []);
      const last = getLastTraining(name);
      const next = getNextSuggestion(name);
      const lastText = last ? `Zuletzt: <strong>${esc(last.plan)} · ${esc(last.label)}</strong>` : 'Noch kein Training abgeschlossen';
      const btn = document.createElement('button');
      btn.className = 'user-btn';
      btn.type = 'button';
      btn.innerHTML = `<div class="avatar" style="background:${c.bg};color:${c.c}">${initial(name)}</div><div class="uinfo"><div class="uname">${esc(name)}</div><div class="ustats">${sessions.length} gespeicherte Übungen</div><div class="profile-meta">${lastText}<br>Vorschlag: <span class="profile-next">${esc(next.plan)} · ${esc(next.label)}</span></div></div><div class="uarrow">›</div>`;
      btn.addEventListener('click', () => loginUser(name));
      list.appendChild(btn);
    });
  }
  function addUser() {
    const input = $('new-user-inp');
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const users = getUsers();
    if (!users.includes(name)) { users.push(name); saveUsers(users); }
    input.value = '';
    $('add-user-btn').classList.remove('ready');
    renderUserScreen();
    loginUser(name);
  }
  function loginUser(name) {
    user = name;
    progressUser = name;
    applySavedTheme();
    $('screen-users').classList.add('hidden');
    $('screen-app').style.display = 'block';
    const c = colorFor(Math.max(0, getUsers().indexOf(name)));
    $('h-avatar').textContent = initial(name);
    $('h-avatar').style.background = c.bg;
    $('h-avatar').style.color = c.c;
    $('h-name').textContent = name;
    const pinnedOnLogin = getPinnedPlans(name);
    if (pinnedOnLogin.length && plans[pinnedOnLogin[0]]) { plan = pinnedOnLogin[0]; days = plans[plan]; }
    day = 0; warmup = {}; openExercise = null; inputs = {}; setCounts = {}; finished = {}; daySwaps = {}; swapOpen = {};
    renderPlanTabs();
    renderDayTabs();
    setScreen('home');
  }
  function goUsers() {
    saveCurrentInputs();
    user = null;
    $('screen-app').style.display = 'none';
    $('screen-users').classList.remove('hidden');
    $('new-user-inp').value = '';
    $('add-user-btn').classList.remove('ready');
    renderUserScreen();
  }
  function setScreen(nextScreen) {
    if (nextScreen !== 'train') saveCurrentInputs();
    screen = nextScreen;
    $('tab-home').classList.toggle('active', screen === 'home');
    $('tab-train').classList.toggle('active', screen === 'train');
    $('top-plans').classList.toggle('active', screen === 'plans');
    const accountMenu = $('account-menu');
    if (accountMenu) accountMenu.classList.remove('show');
    $('daytabs').style.display = screen === 'train' ? 'flex' : 'none';
    $('split-tabs').style.display = screen === 'train' ? 'flex' : 'none';
    $('home-content').classList.toggle('active', screen === 'home');
    $('train-content').classList.toggle('active', screen === 'train');
    $('prog-content').classList.toggle('active', screen === 'progress');
    $('plan-content').classList.toggle('active', screen === 'plans');
    $('settings-content').classList.toggle('active', screen === 'settings');
    $('finish-bar').style.display = screen === 'train' ? 'block' : 'none';
    if (screen === 'home') renderDashboard(); else if (screen === 'progress') renderProgress(); else if (screen === 'plans') renderPlanBuilder(); else if (screen === 'settings') renderSettings(); else renderTraining();
  }
  function setPlan(name) {
    saveCurrentInputs();
    plan = name; days = plans[plan] || plans.Ganzkoerper; day = 0; openExercise = null; warmup = {}; inputs = {}; setCounts = {}; finished = {};
    renderPlanTabs(); renderDayTabs(); renderTraining();
  }
  function renderPlanTabs() {
    const wrap = $('split-tabs');
    wrap.innerHTML = '';
    const pinnedList = getPinnedPlans();
    const visiblePlans = (screen === 'train' && pinnedList.length === 0) ? [] : Array.from(new Set(pinnedList.concat([plan]))).filter((name) => plans[name]);
    visiblePlans.forEach((name) => {
      const b = document.createElement('button');
      b.className = 'split-btn' + (name === plan ? ' active' : '');
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', () => setPlan(name));
      wrap.appendChild(b);
    });
  }
  function renderDayTabs() {
    const wrap = $('daytabs'); wrap.innerHTML = '';
    days.forEach((d, i) => { const b = document.createElement('button'); b.className = 'daytab' + (i === day ? ' active' : ''); b.type = 'button'; b.textContent = d.label; b.addEventListener('click', () => { saveCurrentInputs(); day = i; openExercise = null; warmup = {}; finishConfirm = false; renderDayTabs(); renderTraining(); }); wrap.appendChild(b); });
  }
  function saveCurrentInputs() {
    if (!user || screen !== 'train' || !days[day]) return;
    if (!inputs[day]) inputs[day] = {};
    days[day].ex.forEach((ex) => { const count = setCounts[ex.id] || 3; inputs[day][ex.id] = Array.from({ length: count }, (_, i) => ({ kg: $('kg_' + ex.id + '_' + i)?.value || '', reps: $('reps_' + ex.id + '_' + i)?.value || '' })); });
  }
  function inputValue(id, i, field) { return inputs[day]?.[id]?.[i]?.[field] || ''; }
  function openSuggestedTraining() { const s = getNextSuggestion(user); plan = s.plan; days = plans[plan]; day = s.dayIndex; openExercise = null; warmup = {}; renderPlanTabs(); renderDayTabs(); setScreen('train'); }


  function allUserExerciseSessions(name) {
    return S.keys().filter((key) => key.indexOf('h_') === 0).flatMap((key) => S.get(key, []).filter((entry) => entry.user === name).map((entry) => Object.assign({ exerciseId: key.slice(2) }, entry)));
  }
  function weekKeyFromTs(ts) {
    const d = new Date(ts || Date.now());
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = Math.floor((d - start) / 86400000);
    return d.getFullYear() + '-W' + Math.ceil((diff + start.getDay() + 1) / 7);
  }
  function getWorkoutSummary() {
    const log = getTrainingLog(user);
    const thisWeek = weekKeyFromTs(Date.now());
    const weekCount = log.filter((entry) => weekKeyFromTs(entry.ts) === thisWeek).length;
    const sessions = allUserExerciseSessions(user);
    const totalSets = sessions.reduce((sum, entry) => sum + (entry.sets ? entry.sets.length : 0), 0);
    const totalVolume = Math.round(sessions.reduce((sum, entry) => sum + (entry.sets || []).reduce((inner, set) => inner + ((parseFloat(set.kg) || 0) * (parseFloat(set.reps) || 0)), 0), 0));
    return { weekCount, totalSets, totalVolume, sessions };
  }
  function getRecentPRs(name, limit = 3) {
    const prs = S.get('prs_' + name, []);
    return Array.isArray(prs) ? prs.slice(-limit).reverse() : [];
  }
  function renderDashboard() {
    const pinned = getPinnedPlans();
    const last = getLastTraining(user);
    const next = getNextSuggestion(user);
    const summary = getWorkoutSummary();
    const recentPRs = getRecentPRs(user, 4);
    const lastSummary = S.get('lastWorkoutSummary_' + user, null);
    const log = getTrainingLog(user).slice(-5).reverse();
    const latestSessions = allUserExerciseSessions(user).slice(-30);
    const uniqueExercises = Array.from(new Set(latestSessions.map((entry) => entry.exerciseId))).slice(-4);
    const progressCards = uniqueExercises.length ? uniqueExercises.map((id) => {
      const entries = latestSessions.filter((entry) => entry.exerciseId === id);
      const lastEntry = entries[entries.length - 1];
      const exName = (allExercises.find((ex) => ex.id === id) || {}).n || id;
      const best = entries.flatMap((entry) => (entry.sets || []).map((set) => ({ kg: parseFloat(set.kg) || 0, reps: parseFloat(set.reps) || 0 }))).sort((a,b)=>(b.kg*b.reps)-(a.kg*a.reps))[0];
      return `<div class="mini-progress-card"><strong>${esc(exName)}</strong><span>Letztes Mal: ${lastEntry ? esc(lastEntry.date) : '-'}<br>${best ? 'Bestwert: '+best.kg+'kg × '+best.reps : 'Noch kein Bestwert'}</span></div>`;
    }).join('') : '<div class="empty small"><h3>Noch kein Fortschritt</h3><p>Speichere Sätze, dann erscheinen hier deine Werte.</p></div>';
    const pinnedHtml = pinned.length ? `<div class="pinned-plans-grid">${pinned.map((name)=>{ const p=plans[name]||[]; return `<div class="pinned-plan-card"><div class="pinned-plan-top"><div><div class="pinned-plan-name">${esc(name)}</div><div class="pinned-plan-meta">${p.length} Tage · ${p.reduce((s,d)=>s+d.ex.length,0)} Übungen</div></div><button class="hub-btn primary" type="button" data-start-plan="${esc(name)}">Starten</button></div></div>`; }).join('')}</div>` : `<div class="empty-hero"><div class="empty-hero-icon">📌</div><h3>Keine Pläne angeheftet</h3><p>Wähle dir in der Planbibliothek deine Trainingspläne aus. Erst dann erscheint im Training etwas.</p><div class="empty-actions"><button class="primary" type="button" id="home-pin-plan">Plan anheften</button><button class="secondary" type="button" id="home-create-plan">Plan erstellen</button></div></div>`;
    const prsHtml = recentPRs.length ? recentPRs.map((pr) => `<div class="pr-row"><span>🏆 ${esc(pr.exercise)}</span><strong>${pr.kg}kg × ${pr.reps}</strong></div>`).join('') : '<div class="quick-sub">Noch keine PRs. Speichere ein paar Einheiten.</div>';
    const historyHtml = log.length ? log.map((entry) => `<div class="mini-cal-item"><span>${esc(entry.date)}</span><strong>${esc(entry.plan)} · ${esc(entry.label)}</strong></div>`).join('') : '<div class="empty small"><h3>Noch keine abgeschlossenen Tage</h3><p>Schließe ein Training ab, dann erscheint es hier.</p></div>';
    $('home-content').innerHTML = `<div class="dashboard-hero"><div><div class="quick-label">Home</div><div class="dashboard-title">Hi ${esc(user)}</div><div class="quick-sub">${last ? `Zuletzt: ${esc(last.plan)} · ${esc(last.label)} am ${esc(last.date)}` : 'Noch kein Training abgeschlossen.'}</div></div>${pinned.length ? `<button class="quick-btn" id="home-start" type="button">${esc(next.label)} öffnen</button>` : ''}</div><div class="dash-grid"><div class="dash-stat"><strong>${summary.weekCount}</strong><span>Diese Woche</span></div><div class="dash-stat"><strong>${summary.totalSets}</strong><span>Sätze gesamt</span></div><div class="dash-stat"><strong>${summary.totalVolume}</strong><span>kg Volumen</span></div></div><div class="home-section-title"><h3>Angeheftete Pläne</h3><span>Training</span></div>${pinnedHtml}<div class="home-section-title"><h3>Fortschritt</h3><span>Live</span></div><div class="mini-progress-grid">${progressCards}</div>${lastSummary ? `<div class="quick-card"><div class="quick-label">Letzte Zusammenfassung</div><div class="quick-title">${esc(lastSummary.plan)} · ${esc(lastSummary.label)}</div><div class="quick-sub">${lastSummary.exercises} Übungen · ${lastSummary.sets} Sätze · ${lastSummary.volume}kg Volumen</div></div>` : ''}<div class="quick-card"><div class="quick-label">PRs</div><div class="quick-title">Persönliche Rekorde</div>${prsHtml}</div><div class="quick-card mini-calendar"><div class="quick-label">Verlauf</div><div class="quick-title">Letzte Trainings</div>${historyHtml}</div>`;
    $('home-start')?.addEventListener('click', openSuggestedTraining);
    $('home-pin-plan')?.addEventListener('click', () => setScreen('plans'));
    $('home-create-plan')?.addEventListener('click', () => { setScreen('plans'); setTimeout(() => $('blank-template')?.click(), 50); });
    document.querySelectorAll('[data-start-plan]').forEach((btn) => btn.addEventListener('click', () => { setPlan(btn.dataset.startPlan); setScreen('train'); }));
  }

  function renderTraining() {
    const d = days[day]; const suggestion = user ? getNextSuggestion(user) : null; const last = user ? getLastTraining(user) : null; let html = '';
    if (suggestion) {
      const active = suggestion.plan === plan && suggestion.dayIndex === day;
      html += `<div class="quick-card"><div class="quick-top"><div><div class="quick-label">Nächster Vorschlag</div><div class="quick-title">${esc(suggestion.plan)} · ${esc(suggestion.label)}</div><div class="quick-sub">${last ? `Zuletzt abgeschlossen: ${esc(last.plan)} · ${esc(last.label)} am ${esc(last.date)}` : 'Noch kein abgeschlossener Trainingstag vorhanden.'}</div></div>${active ? '<span class="quick-done">Aktuell offen</span>' : '<button class="quick-btn" type="button" id="open-suggestion">Öffnen</button>'}</div></div>`;
    }
    html += '<div class="sec-lbl">🔥 Warm-Up · Calisthenics</div><div class="wu-row">';
    D.WARMUP.forEach((name) => { const done = !!warmup[name]; html += `<div class="wu-card ${done ? 'done' : ''}" data-warmup="${name}"><div class="wu-img"><img src="${imageFor(name)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"></div><div class="wu-lbl">${done ? '✓ ' : ''}${name}</div><div class="wu-tick">✓</div></div>`; });
    html += `</div><div class="sec-lbl">💪 ${esc(plan)} · ${esc(d.label)}</div>`;
    d.ex.forEach((ex) => { html += renderCard(ex); });
    $('train-content').innerHTML = html;
    $('open-suggestion')?.addEventListener('click', openSuggestedTraining);
    document.querySelectorAll('[data-warmup]').forEach((el) => el.addEventListener('click', () => { warmup[el.dataset.warmup] = !warmup[el.dataset.warmup]; renderTraining(); }));
    renderFinishBar();
  }
  function renderSwapCards(current, originalId) {
    const groups = {};
    getExerciseDB().forEach((item) => { groups[item.m] = groups[item.m] || []; groups[item.m].push(item); });
    return Object.keys(groups).map((muscle) => `<div class="group-title">${esc(muscle)}</div><div class="swap-grid">${groups[muscle].map((item) => `<div class="swap-card ${item.n === current.n ? 'active' : ''}"><img src="${imageFor(item.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="swap-card-body"><div class="swap-muscle">${esc(item.m)}</div><div class="swap-name">${esc(item.n)}</div><button class="swap-select-btn" type="button" data-swap-id="${originalId}" data-swap-m="${esc(item.m)}" data-swap-n="${esc(item.n)}">${item.n === current.n ? 'Aktiv' : 'Auswählen'}</button></div></div>`).join('')}</div>`).join('');
  }
  function renderCard(original) {
    const ex = displayExercise(original); const st = styleFor(ex.m); const isOpen = openExercise === original.id; const isDone = !!S.get(doneKey(original.id), false); const hist = getHistory(original.id).slice(-3); const last = hist[hist.length - 1]; const count = setCounts[original.id] || 3;
    if (!isOpen) return `<div class="ex-card ${isDone ? 'edone' : ''}" id="card_${original.id}"><div class="ex-row" data-open="${original.id}"><div class="ex-thumb"><img src="${imageFor(ex.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"></div><div class="ex-info"><div class="ex-mtag" style="color:${st.c}">${esc(ex.m)}</div><div class="ex-name">${esc(ex.n)}</div>${last ? `<div class="ex-last">${esc(last.date)} · ${last.sets.map((set) => `${set.kg}kgx${set.reps}`).join('  ')}</div>` : ''}</div><div class="ex-r">${isDone ? '<div class="done-chk">✓</div>' : `<div class="sets-badge">${count} Sätze</div><div class="chevron">›</div>`}</div></div></div>`;
    let rows = '';
    for (let i = 0; i < count; i += 1) rows += `<div class="set-row"><div class="snum" style="background:${st.bg};color:${st.c}">S${i + 1}</div><input class="ninp" type="number" inputmode="decimal" id="kg_${original.id}_${i}" value="${inputValue(original.id, i, 'kg')}"><input class="ninp" type="number" inputmode="numeric" id="reps_${original.id}_${i}" value="${inputValue(original.id, i, 'reps')}"><button class="del-btn" type="button" data-del-set="${original.id}" data-del-index="${i}">−</button></div>`;
    const history = hist.length ? `<div class="hist"><div class="hist-ttl">Letzte Einheiten</div>${hist.map((entry) => `<div class="hentry"><div class="hdate">${esc(entry.date)} · ${esc(entry.user)}</div><div class="hpills">${entry.sets.map((set, i) => `<span class="hpill" style="background:${st.bg};color:${st.c};border-color:${st.c}44">S${i + 1} ${set.kg}kgx${set.reps}</span>`).join('')}</div></div>`).join('')}</div>` : '';
    return `<div class="ex-card open ${isDone ? 'edone' : ''}" id="card_${original.id}" style="border-color:${st.c}55"><div class="ex-hero" data-open="${original.id}"><img src="${imageFor(ex.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="grad"></div><div class="hbadge" style="background:${st.c}">${esc(ex.m)}</div><div class="hbot"><div class="hname">${esc(ex.n)}</div><div class="hhint">schließen</div></div></div><div class="ex-body"><div class="swap-box"><button class="swap-toggle" type="button" data-toggle-swap="${original.id}"><span>🔄 Übung heute tauschen</span><span>${swapOpen[original.id] ? '−' : '+'}</span></button><div class="swap-content ${swapOpen[original.id] ? 'open' : ''}"><div class="swap-title">Alternative Übungen</div><div class="swap-grid">${renderSwapCards(ex, original.id)}</div><div class="swap-note">${ex.swapped ? `<button type="button" data-reset-swap="${original.id}" style="background:none;color:var(--red);font-weight:900;padding:0">Zurücksetzen</button>` : 'Der feste Plan bleibt erhalten. Der Tausch gilt nur für den aktuellen Trainingstag.'}</div></div></div>${history}<div class="inp-ttl">Heute eintragen</div><div class="col-hd"><span></span><span>kg</span><span>Wdh.</span><span></span></div>${rows}<div class="rest-row"><button class="rest-btn" type="button" data-fill-last="${original.id}">↩︎ Letzte Werte</button><button class="rest-btn" type="button" data-ex-detail="${original.id}">ℹ️ Details</button></div><button class="add-s-btn" type="button" data-add-set="${original.id}">+ Satz hinzufügen</button><div class="rest-row"><button class="rest-btn" type="button" data-rest="90">⏱️ 1:30</button><button class="rest-btn" type="button" data-rest="180">💤 3:00</button></div><button class="save-btn" type="button" data-save-ex="${original.id}" data-set-count="${count}" style="background:${st.c}">Einheit speichern</button></div></div>`;
  }
  function renderFinishBar() {
    const done = days[day].ex.filter((ex) => S.get(doneKey(ex.id), false)).length;
    const total = days[day].ex.length;
    const inner = $('finish-bar-inner');
    if (finished[day]) {
      inner.innerHTML = `<div class="finish-done-msg"><div class="fdm-txt">Training abgeschlossen. Gut gemacht, ${esc(user)}</div></div>`;
      return;
    }
    if (finishConfirm) {
      inner.innerHTML = `<div class="finish-confirm"><div class="finish-confirm-title">Training wirklich abschließen?</div><div class="finish-confirm-actions"><button class="finish-no" id="finish-cancel" type="button">Abbrechen</button><button class="finish-yes" id="finish-confirm" type="button">Wirklich abschließen</button></div></div>`;
      $('finish-cancel').addEventListener('click', () => { finishConfirm = false; renderFinishBar(); });
      $('finish-confirm').addEventListener('click', () => { const summary = buildDayWorkoutSummary(); S.set('lastWorkoutSummary_' + user, summary); recordCompletedTraining(); finished[day] = true; finishConfirm = false; showToast('Training abgeschlossen: ' + summary.exercises + ' Übungen · ' + summary.sets + ' Sätze'); renderUserScreen(); renderTraining(); });
      return;
    }
    inner.innerHTML = `<button class="finish-btn ${done === total ? 'ready' : ''}" id="finish-training" type="button">${done === total ? 'Training abschließen' : `Training beenden (${done}/${total} erledigt)`}</button>`;
    $('finish-training').addEventListener('click', () => { saveCurrentInputs(); finishConfirm = true; renderFinishBar(); });
  }
  function bindDynamicEvents() {
    document.addEventListener('click', (e) => {
      const open = e.target.closest('[data-open]'); if (open) { saveCurrentInputs(); openExercise = openExercise === open.dataset.open ? null : open.dataset.open; renderTraining(); setTimeout(() => $('card_' + openExercise)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); return; }
      const add = e.target.closest('[data-add-set]'); if (add) { saveCurrentInputs(); const id = add.dataset.addSet; setCounts[id] = (setCounts[id] || 3) + 1; inputs[day] = inputs[day] || {}; inputs[day][id] = inputs[day][id] || []; inputs[day][id].push({ kg: '', reps: '' }); renderTraining(); return; }
      const del = e.target.closest('[data-del-set]'); if (del) { saveCurrentInputs(); const id = del.dataset.delSet; const idx = Number(del.dataset.delIndex); if ((setCounts[id] || 3) <= 1) return; setCounts[id] = (setCounts[id] || 3) - 1; inputs[day]?.[id]?.splice(idx, 1); renderTraining(); return; }
      const save = e.target.closest('[data-save-ex]'); if (save) { saveExercise(save.dataset.saveEx, Number(save.dataset.setCount)); return; }
      const rest = e.target.closest('[data-rest]'); if (rest) { startRestTimer(Number(rest.dataset.rest)); return; }
      const fill = e.target.closest('[data-fill-last]'); if (fill) { fillLastValues(fill.dataset.fillLast); return; }
      const detail = e.target.closest('[data-ex-detail]'); if (detail) { progressExercise = displayExercise(findExerciseById(detail.dataset.exDetail)).n; setScreen('progress'); return; }
      const sw = e.target.closest('[data-swap-id]'); if (sw) { daySwaps[swapKey(sw.dataset.swapId)] = { id: sw.dataset.swapId, m: sw.dataset.swapM, n: sw.dataset.swapN, swapped: true }; openExercise = sw.dataset.swapId; renderTraining(); return; }
      const toggleSwap = e.target.closest('[data-toggle-swap]'); if (toggleSwap) { swapOpen[toggleSwap.dataset.toggleSwap] = !swapOpen[toggleSwap.dataset.toggleSwap]; renderTraining(); return; }
      const resetSwap = e.target.closest('[data-reset-swap]'); if (resetSwap) { delete daySwaps[swapKey(resetSwap.dataset.resetSwap)]; openExercise = resetSwap.dataset.resetSwap; renderTraining(); }
    });
    document.addEventListener('input', (e) => {
      const input = e.target.closest('.ninp');
      if (!input || !openExercise) return;
      saveCurrentInputs();
      const match = input.id.match(/^(kg|reps)_(.+)_(\d+)$/);
      if (!match) return;
      const id = match[2];
      const idx = Number(match[3]);
      const kg = $('kg_' + id + '_' + idx)?.value;
      const reps = $('reps_' + id + '_' + idx)?.value;
      const timerKey = plan + '_' + day + '_' + id + '_' + idx;
      if (kg && reps && !completedSetTimers[timerKey]) {
        completedSetTimers[timerKey] = true;
        startRestTimer(90);
      }
      if (!kg || !reps) completedSetTimers[timerKey] = false;
    });
  }

  function bestSetFromHistory(id) {
    const hist = getHistory(id);
    let best = { kg: 0, reps: 0, volume: 0 };
    hist.forEach((entry) => (entry.sets || []).forEach((set) => {
      const kg = parseFloat(set.kg) || 0;
      const reps = parseFloat(set.reps) || 0;
      const volume = kg * reps;
      if (kg > best.kg || volume > best.volume) best = { kg, reps, volume };
    }));
    return best;
  }
  function findExerciseById(id) {
    return Object.values(plans).flatMap((p) => p.flatMap((d) => d.ex)).find((ex) => ex.id === id) || allExercises.find((ex) => ex.id === id) || { id, n: id, m: 'Training' };
  }
  function registerPR(id, sets) {
    const exercise = findExerciseById(id);
    const previous = bestSetFromHistory(id);
    let newBest = null;
    sets.forEach((set) => {
      const kg = parseFloat(set.kg) || 0;
      const reps = parseFloat(set.reps) || 0;
      const volume = kg * reps;
      if (kg && reps && (kg > previous.kg || volume > previous.volume)) newBest = { exercise: exercise.n, kg, reps, volume, date: dateStr(), ts: Date.now() };
    });
    if (newBest) {
      const prs = S.get('prs_' + user, []);
      prs.push(newBest);
      S.set('prs_' + user, prs.slice(-80));
      showToast('Neue PR: ' + newBest.exercise + ' · ' + newBest.kg + 'kg x ' + newBest.reps);
      return true;
    }
    return false;
  }
  function fillLastValues(id) {
    const hist = getHistory(id);
    if (!hist.length) { showToast('Noch keine gespeicherten Werte.'); return; }
    const last = hist[hist.length - 1];
    const count = Math.max(setCounts[id] || 3, last.sets.length || 3);
    setCounts[id] = count;
    inputs[day] = inputs[day] || {};
    inputs[day][id] = Array.from({ length: count }, (_, i) => ({ kg: last.sets[i]?.kg || '', reps: last.sets[i]?.reps || '' }));
    renderTraining();
    showToast('Letzte Werte übernommen.');
  }

  function saveExercise(id, count) {
    saveCurrentInputs();
    const sets = Array.from({ length: count }, (_, i) => ({ kg: inputs[day]?.[id]?.[i]?.kg || '0', reps: inputs[day]?.[id]?.[i]?.reps || '0' }));
    const ex = displayExercise(findExerciseById(id));
    const entry = { date: dateStr(), user, sets, exercise: ex.n, muscle: ex.m, ts: Date.now() };
    registerPR(id, sets);
    S.set('h_' + id, [...getHistory(id), entry].slice(-80));
    const sessions = S.get('sessions_' + user, []);
    sessions.push({ date: entry.date, day, plan, exercise: ex.n, ts: Date.now() });
    S.set('sessions_' + user, sessions.slice(-300));
    S.set(doneKey(id), true);
    openExercise = null;
    startRestTimer(90);
    renderTraining();
  }
  function startRestTimer(seconds) {
    clearInterval(window.__restTimer);
    const duration = (Number(seconds) || 90) * 1000;
    window.__restEndAt = Date.now() + duration;
    $('rest-float').classList.add('show');
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((window.__restEndAt - Date.now()) / 1000));
      $('rest-time').textContent = remaining <= 0 ? 'Fertig' : String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0');
      if (remaining <= 0) { clearInterval(window.__restTimer); return; }
    };
    tick();
    window.__restTimer = setInterval(tick, 500);
  }

  function renderProgress() {
    const current = allExercises.find((ex) => ex.n === progressExercise) || allExercises[0];
    const st = styleFor(current.m);
    const ids = Object.values(plans).flatMap((p) => p.flatMap((d) => d.ex)).filter((ex) => ex.n === progressExercise).map((ex) => ex.id);
    const hist = ids.flatMap(getHistory).filter((entry) => !progressUser || entry.user === progressUser);
    const alternatives = getExerciseDB().filter((item) => item.m === current.m && item.n !== current.n).slice(0, 8);
    const best = hist.length ? hist.flatMap((entry) => entry.sets.map((set) => ({ kg: parseFloat(set.kg) || 0, reps: parseFloat(set.reps) || 0, date: entry.date }))).sort((a, b) => (b.kg * b.reps) - (a.kg * a.reps))[0] : null;
    const groups = {};
    allExercises.forEach((ex) => { groups[ex.m] = groups[ex.m] || []; groups[ex.m].push(ex); });
    let html = '<div class="sec-lbl">📊 Übung wählen</div>';
    html += Object.keys(groups).map((muscle) => `<details class="progress-group" ${muscle === current.m ? 'open' : ''}><summary>${esc(muscle)}</summary><div class="pill-wrap">${groups[muscle].map((ex) => { const s = styleFor(ex.m); const active = ex.n === progressExercise; return `<button class="pill" type="button" data-progress-ex="${esc(ex.n)}" style="background:${active ? s.bg : 'var(--card2)'};color:${active ? s.c : 'var(--muted)'};border-color:${active ? s.c + '55' : 'transparent'}">${esc(ex.n)}</button>`; }).join('')}</div></details>`).join('');
    html += `<div class="hero-card exercise-detail"><div class="hero-img"><img src="${imageFor(progressExercise)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="hgrad"></div><div class="hero-info"><div class="hbadge2" style="background:${st.c}">${esc(current.m)}</div><div class="hname2">${esc(progressExercise)}</div></div></div>`;
    if (hist.length) {
      const maxKg = Math.max(...hist.flatMap((entry) => entry.sets.map((set) => parseFloat(set.kg) || 0)));
      const maxReps = Math.max(...hist.flatMap((entry) => entry.sets.map((set) => parseFloat(set.reps) || 0)));
      const volume = Math.round(hist.reduce((sum, entry) => sum + (entry.sets || []).reduce((inner, set) => inner + ((parseFloat(set.kg) || 0) * (parseFloat(set.reps) || 0)), 0), 0));
      html += `<div class="stats-row"><div class="stat"><div class="stat-val" style="color:${st.c}">${hist.length}</div><div class="stat-lbl">Einheiten</div></div><div class="stat"><div class="stat-val" style="color:${st.c}">${maxKg}kg</div><div class="stat-lbl">Max kg</div></div><div class="stat"><div class="stat-val" style="color:${st.c}">${volume}</div><div class="stat-lbl">Volumen</div></div></div>`;
    }
    html += '</div>';
    html += `<div class="quick-card"><div class="quick-label">Übungsseite</div><div class="quick-title">${esc(progressExercise)}</div><div class="quick-sub">Zielmuskel: ${esc(current.m)}${best ? ` · Bester Satz: ${best.kg}kg × ${best.reps} am ${esc(best.date)}` : ''}</div>${alternatives.length ? `<div class="alt-list">${alternatives.map((item) => `<button type="button" class="alt-chip" data-progress-ex="${esc(item.n)}">${esc(item.n)}</button>`).join('')}</div>` : ''}</div>`;
    if (!hist.length) { $('prog-content').innerHTML = html + '<div class="empty"><h3>Noch keine Daten</h3><p>Trage eine Einheit ein.</p></div>'; bindProgressEvents(); return; }
    const labels = hist.map((h) => h.date);
    const kgData = hist.map((h) => avg(h.sets.map((s) => parseFloat(s.kg) || 0)));
    const repsData = hist.map((h) => avg(h.sets.map((s) => parseFloat(s.reps) || 0)));
    html += '<div class="chart-box"><div class="chart-lbl">Ø Gewicht</div><canvas id="cKg"></canvas></div><div class="chart-box"><div class="chart-lbl">Ø Wiederholungen</div><canvas id="cRp"></canvas></div><div class="sec-lbl">Verlauf</div>' + [...hist].reverse().map((entry) => `<div class="log-entry"><div class="log-top"><span class="log-d" style="color:${st.c}">${entry.date}</span><span class="log-u">${esc(entry.user)}</span></div><div class="log-pills">${entry.sets.map((set, i) => `<span class="lpill" style="background:${st.bg};color:${st.c};border-color:${st.c}44">S${i + 1}: ${set.kg}kgx${set.reps}</span>`).join('')}</div></div>`).join('');
    $('prog-content').innerHTML = html;
    bindProgressEvents();
    drawChart('kg', $('cKg'), labels, kgData, st.c, 'kg');
    drawChart('reps', $('cRp'), labels, repsData, '#ff9f0a', '');
  }
  function bindProgressEvents() { document.querySelectorAll('[data-progress-ex]').forEach((b) => b.addEventListener('click', () => { progressExercise = b.dataset.progressEx; renderProgress(); })); }

  function avg(values) { return +(values.reduce((s, v) => s + v, 0) / Math.max(values.length, 1)).toFixed(1); }
  function drawChart(key, canvas, labels, data, color, unit) { if (!window.Chart || !canvas) return; if (charts[key]) charts[key].destroy(); charts[key] = new Chart(canvas, { type: 'line', data: { labels, datasets: [{ data, borderColor: color, backgroundColor: color + '22', borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: color, tension: .35, fill: true }] }, options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => String(ctx.parsed.y) + unit } } }, scales: { x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,.05)' } }, y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,.05)' } } } } }); }

  function renderExercisePicker(selectId) {
    const groups = {};
    getExerciseDB().forEach((item) => { groups[item.m] = groups[item.m] || []; groups[item.m].push(item); });
    return `<select class="builder-select" id="${selectId}">${Object.keys(groups).map((muscle) => `<optgroup label="${esc(muscle)}">${groups[muscle].map((item) => `<option value="${esc(item.m)}|${esc(item.n)}">${esc(item.n)}</option>`).join('')}</optgroup>`).join('')}</select>`;
  }
  function renderPlanBuilder() {
    const base = Object.keys(D.BASE_PLANS);
    const custom = Object.keys(plans).filter((name) => !base.includes(name));
    const pinned = new Set(getPinnedPlans());
    let html = `<div class="builder-card"><div class="builder-title">🛠️ Plan-Bibliothek</div><div class="builder-sub">Wähle, welche Pläne oben angeheftet sind. Eigene Pläne kannst du bearbeiten, duplizieren oder löschen.</div></div>`;
    html += Object.keys(plans).map((name) => {
      const p = plans[name] || [];
      const isBase = base.includes(name);
      return `<div class="plan-library-card"><div class="plan-library-head"><div><div>${pinned.has(name) ? '<span class="pinned-tag">Angeheftet</span>' : ''}</div><div class="plan-library-name">${esc(name)}</div><div class="plan-library-meta">${p.length} Trainingstage · ${p.reduce((sum, d) => sum + d.ex.length, 0)} Übungen ${isBase ? '· Vorlage' : '· eigener Plan'}</div></div><button class="pin-btn ${pinned.has(name) ? 'active' : ''}" data-pin-plan="${esc(name)}">${pinned.has(name) ? 'Lösen' : 'Anheften'}</button></div><div class="builder-row" style="margin-top:10px"><button class="builder-btn secondary" data-dup-plan="${esc(name)}">Duplizieren</button>${isBase ? `<button class="builder-btn secondary" data-edit-copy="${esc(name)}">Kopie bearbeiten</button>` : `<button class="builder-btn secondary" data-edit-plan="${esc(name)}">Bearbeiten</button>`}</div>${isBase ? '' : `<button class="builder-btn danger" style="width:100%;margin-top:8px" data-delete-plan="${esc(name)}">Plan löschen</button>`}</div>`;
    }).join('');

    html += `<div class="builder-card"><div class="builder-title">Neuen Plan erstellen</div><div class="builder-sub">Starte leer oder kopiere eine Vorlage.</div><input class="builder-input" id="builder-name" placeholder="Name des Plans" value="${esc(planDraft?.name || 'Mein Plan')}"><select class="builder-select" id="builder-template">${Object.keys(plans).map((name) => `<option value="${esc(name)}">Vorlage: ${esc(name)}</option>`).join('')}</select><div class="builder-row"><button class="builder-btn" type="button" id="copy-template">Vorlage kopieren</button><button class="builder-btn secondary" type="button" id="blank-template">Leer starten</button></div><button class="builder-btn secondary" style="width:100%;margin-top:8px" type="button" id="add-draft-day">+ Tag hinzufügen</button></div>`;

    html += `<div class="custom-ex-card"><div class="builder-title">Eigene Übung erstellen</div><div class="builder-sub">Wenn eine Übung fehlt, kannst du sie hier zur lokalen Datenbank hinzufügen. Ein Bild ist optional.</div><div class="custom-ex-row"><select class="builder-select" id="custom-ex-muscle"><option>Brust</option><option>Ruecken</option><option>Schulter</option><option>Bizeps</option><option>Trizeps</option><option>Bauch</option><option>Beine</option><option>Waden</option></select><input class="builder-input" id="custom-ex-name" placeholder="Übungsname"></div><input class="builder-input" id="custom-ex-image-url" placeholder="Bild-URL optional"><div class="custom-file">oder Bild vom Handy hochladen: <input id="custom-ex-file" type="file" accept="image/*"></div><button class="builder-btn" style="width:100%;margin-top:10px" id="save-custom-ex" type="button">Übung speichern</button></div>`;

    if (planDraft) {
      html += `<div class="builder-card"><span class="custom-pill">Entwurf aktiv</span><div class="builder-title">${esc(planDraft.name)}</div><div class="builder-sub">Live bearbeiten und speichern, wenn alles passt.</div><button class="builder-btn" id="save-draft">Plan speichern</button></div>` + planDraft.days.map((d, di) => `<div class="day-builder"><div class="day-builder-head"><input class="builder-input" data-day-label="${di}" value="${esc(d.label)}" style="margin:0"><button class="builder-mini" data-remove-day="${di}">×</button></div>${d.ex.length ? d.ex.map((ex, ei) => `<div class="builder-ex"><img src="${imageFor(ex.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="builder-ex-info"><div class="builder-ex-muscle">${esc(ex.m)}</div><div class="builder-ex-name">${esc(ex.n)}</div></div><button class="builder-mini" data-move-ex="${di}|${ei}|-1">↑</button><button class="builder-mini" data-move-ex="${di}|${ei}|1">↓</button><button class="builder-mini" data-remove-ex="${di}|${ei}">×</button></div>`).join('') : '<div class="builder-empty">Noch keine Übungen.</div>'}${renderExercisePicker('add-ex-' + di)}<button class="builder-btn secondary" data-add-ex="${di}">+ Übung hinzufügen</button></div>`).join('');
    } else {
      html += '<div class="builder-card"><div class="builder-sub">Noch kein Entwurf offen. Starte leer oder kopiere eine Vorlage.</div></div>';
    }
    $('plan-content').innerHTML = html;
    bindBuilderEvents();
  }
  function bindBuilderEvents() {
    $('builder-name')?.addEventListener('input', (e) => { if (planDraft) planDraft.name = e.target.value.trim() || 'Mein Plan'; });
    $('copy-template')?.addEventListener('click', () => { const t = $('builder-template').value; planDraft = { name: $('builder-name').value.trim() || 'Mein Plan', days: clone(plans[t] || plans.Ganzkoerper) }; renderPlanBuilder(); });
    $('blank-template')?.addEventListener('click', () => { planDraft = { name: $('builder-name').value.trim() || 'Mein Plan', days: [{ label: 'Tag 1', ex: [] }] }; renderPlanBuilder(); });
    $('add-draft-day')?.addEventListener('click', () => { if (!planDraft) planDraft = { name: $('builder-name')?.value.trim() || 'Mein Plan', days: [] }; planDraft.days.push({ label: 'Tag ' + (planDraft.days.length + 1), ex: [] }); renderPlanBuilder(); });
    $('save-draft')?.addEventListener('click', saveDraftPlan);
    $('save-custom-ex')?.addEventListener('click', saveCustomExerciseFromForm);
    document.querySelectorAll('[data-day-label]').forEach((el) => el.addEventListener('input', () => { planDraft.days[Number(el.dataset.dayLabel)].label = el.value.trim() || 'Tag'; }));
    document.querySelectorAll('[data-add-ex]').forEach((b) => b.addEventListener('click', () => { const di = Number(b.dataset.addEx); const [m, n] = $('add-ex-' + di).value.split('|'); planDraft.days[di].ex.push({ id: 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 999), m, n }); renderPlanBuilder(); }));
    document.querySelectorAll('[data-remove-day]').forEach((b) => b.addEventListener('click', () => { planDraft.days.splice(Number(b.dataset.removeDay), 1); if (!planDraft.days.length) planDraft.days.push({ label: 'Tag 1', ex: [] }); renderPlanBuilder(); }));
    document.querySelectorAll('[data-remove-ex]').forEach((b) => b.addEventListener('click', () => { const [di, ei] = b.dataset.removeEx.split('|').map(Number); planDraft.days[di].ex.splice(ei, 1); renderPlanBuilder(); }));
    document.querySelectorAll('[data-move-ex]').forEach((b) => b.addEventListener('click', () => { const [di, ei, dir] = b.dataset.moveEx.split('|').map(Number); const arr = planDraft.days[di].ex; const next = ei + dir; if (next < 0 || next >= arr.length) return; const item = arr.splice(ei, 1)[0]; arr.splice(next, 0, item); renderPlanBuilder(); }));
    document.querySelectorAll('[data-edit-plan]').forEach((b) => b.addEventListener('click', () => { planDraft = { name: b.dataset.editPlan, days: clone(plans[b.dataset.editPlan]) }; renderPlanBuilder(); }));
    document.querySelectorAll('[data-edit-copy]').forEach((b) => b.addEventListener('click', () => { planDraft = { name: b.dataset.editCopy + ' Custom', days: clone(plans[b.dataset.editCopy]) }; renderPlanBuilder(); }));
    document.querySelectorAll('[data-dup-plan]').forEach((b) => b.addEventListener('click', () => { planDraft = { name: b.dataset.dupPlan + ' Copy', days: clone(plans[b.dataset.dupPlan]) }; renderPlanBuilder(); }));
    document.querySelectorAll('[data-delete-plan]').forEach((b) => b.addEventListener('click', () => { if (!confirm('Diesen eigenen Plan löschen?')) return; delete plans[b.dataset.deletePlan]; saveCustomPlans(); renderPlanBuilder(); renderPlanTabs(); }));
    document.querySelectorAll('[data-pin-plan]').forEach((b) => b.addEventListener('click', () => { setPinned(b.dataset.pinPlan, !getPinnedPlans().includes(b.dataset.pinPlan)); renderPlanBuilder(); renderPlanTabs(); }));
  }
  function saveCustomExerciseFromForm() {
    const muscle = $('custom-ex-muscle')?.value || 'Brust';
    const name = ($('custom-ex-name')?.value || '').trim();
    const imageUrl = ($('custom-ex-image-url')?.value || '').trim();
    const file = $('custom-ex-file')?.files?.[0];

    if (!name) { showToast('Bitte Übungsnamen eintragen.'); return; }

    const finish = (image) => {
      const items = getCustomExercises();
      if (!items.some((item) => item.m === muscle && item.n === name)) {
        items.push({ m: muscle, n: name, image: image || '' });
        saveCustomExercises(items);
      } else {
        const existing = items.find((item) => item.m === muscle && item.n === name);
        if (image) existing.image = image;
        saveCustomExercises(items);
      }
      loadPlans();
      showToast('Übung gespeichert.');
      renderPlanBuilder();
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = () => finish(reader.result);
      reader.onerror = () => { showToast('Bild konnte nicht gelesen werden.'); finish(imageUrl); };
      reader.readAsDataURL(file);
    } else finish(imageUrl);
  }

  function saveDraftPlan() { if (!planDraft) return; const name = planDraft.name.trim() || 'Mein Plan'; if (!planDraft.days.some((d) => d.ex.length)) { showToast('Bitte mindestens eine Übung hinzufügen.'); return; } plans[name] = clone(planDraft.days); saveCustomPlans(); setPinned(name, true); plan = name; days = plans[name]; day = 0; planDraft = null; renderPlanTabs(); renderDayTabs(); setScreen('train'); showToast('Plan gespeichert.'); }

  function getThemeForActiveUser() { return S.get(userKey('theme'), S.get('theme_default', 'dark')); }
  function applySavedTheme() { document.body.classList.toggle('light-mode', getThemeForActiveUser() === 'light'); }
  function setTheme(theme) { S.set(userKey('theme'), theme); applySavedTheme(); renderSettings(); }
  function renderSettings() { const theme = getThemeForActiveUser(); $('settings-content').innerHTML = `<div class="settings-card"><div class="settings-title">⚙️ Einstellungen</div><div class="settings-sub">Passe die App an dein Handy und deine Nutzung an.</div><div class="quick-label">Design</div><div class="theme-row"><button class="theme-btn ${theme === 'dark' ? 'active' : ''}" id="dark-theme">🌙 Dunkel</button><button class="theme-btn ${theme === 'light' ? 'active' : ''}" id="light-theme">☀️ Warm hell</button></div><div class="settings-note">Die Auswahl wird für dieses Profil auf diesem Gerät gespeichert.</div></div><div class="settings-card"><div class="settings-title">💾 Daten</div><div class="settings-sub">Bis Firebase kommt, bleiben Daten lokal. Backups helfen beim Sichern oder Gerätewechsel.</div><div class="settings-actions"><button class="settings-action" id="export-data">Backup exportieren</button><button class="settings-action" id="import-data">Backup importieren</button></div><input id="backup-import" type="file" accept="application/json" style="display:none"><div class="settings-actions"><button class="settings-action danger" id="clear-data">Lokale Daten löschen</button></div></div>`; $('dark-theme').addEventListener('click', () => setTheme('dark')); $('light-theme').addEventListener('click', () => setTheme('light')); $('export-data').addEventListener('click', exportLocalData); $('import-data').addEventListener('click', () => $('backup-import').click()); $('backup-import').addEventListener('change', (e) => importLocalData(e.target.files[0])); $('clear-data').addEventListener('click', clearLocalData); }
  function exportLocalData() { const data = { version: 1, exportedAt: new Date().toISOString(), items: {} }; S.keys().forEach((key) => { data.items[key] = localStorage.getItem(key); }); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'gymbaddies-backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('Backup erstellt.'); }
  function importLocalData(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (!data.items) throw new Error('ungueltig'); Object.keys(data.items).forEach((key) => localStorage.setItem(key, data.items[key])); showToast('Backup importiert.'); setTimeout(() => location.reload(), 700); } catch { showToast('Backup konnte nicht importiert werden.'); } }; reader.readAsText(file); }
  function clearLocalData() { if (!confirm('Alle lokalen GymBaddies-Daten auf diesem Gerät löschen?')) return; S.keys().forEach((key) => { if (key === 'users' || key === 'customPlans' || key === 'customExercises' || key === 'theme_default' || key.indexOf('theme_') === 0 || key.indexOf('pinnedPlans_') === 0 || key.indexOf('sessions_') === 0 || key.indexOf('trainingLog_') === 0 || key.indexOf('prs_') === 0 || key.indexOf('h_') === 0 || key.indexOf('done_') === 0) S.remove(key); }); showToast('Daten gelöscht.'); setTimeout(() => location.reload(), 700); }
  function runChecks() { const checks = [['plans', () => Object.keys(plans).length >= 3], ['exercise db', () => D.EXERCISE_DB.length >= 35], ['buttons', () => $('add-user-btn') && $('top-plans') && $('top-profile-menu')], ['storage', () => S.set('__test', true) && S.get('__test') === true]]; checks.forEach(([name, fn]) => { try { if (!fn()) console.warn('Check failed:', name); } catch (e) { console.warn('Check error:', name, e); } }); S.remove('__test'); }
  function toggleAccountMenu() {
    const menu = $('account-menu');
    if (!menu) return;
    menu.classList.toggle('show');
  }
  function closeAccountMenu() { $('account-menu')?.classList.remove('show'); }

  function init() { loadPlans(); migrateLegacyScopedSettings(); applySavedTheme(); renderUserScreen(); bindDynamicEvents(); const input = $('new-user-inp'); const add = $('add-user-btn'); const update = () => add.classList.toggle('ready', !!input.value.trim()); input.addEventListener('input', update); input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addUser(); }); add.addEventListener('click', addUser); add.addEventListener('touchend', (e) => { e.preventDefault(); addUser(); }, { passive: false }); $('top-profile-menu').addEventListener('click', toggleAccountMenu); $('menu-settings').addEventListener('click', () => { closeAccountMenu(); setScreen('settings'); }); $('menu-profile-switch').addEventListener('click', () => { closeAccountMenu(); goUsers(); }); $('menu-close').addEventListener('click', closeAccountMenu); document.addEventListener('click', (event) => { if (!event.target.closest('#account-menu') && !event.target.closest('#top-profile-menu')) closeAccountMenu(); }); $('tab-home').addEventListener('click', () => setScreen('home')); $('tab-train').addEventListener('click', () => setScreen('train')); $('top-plans').addEventListener('click', () => setScreen('plans')); $('rest-close').addEventListener('click', () => { clearInterval(window.__restTimer); $('rest-float').classList.remove('show'); }); update(); runChecks(); }
  document.addEventListener('DOMContentLoaded', init);
}());
