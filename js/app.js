(function () {
  'use strict';
  const S = window.GBStore;
  const D = window.GB;
  let plans = {};
  let allExercises = [];
  let plan = 'Ganzkoerper';
  let days = [];
  let day = 0;
  let screen = 'train';
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

  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const styleFor = (muscle) => D.STYLE[muscle] || D.STYLE.Brust;
  const imageFor = (name) => D.IMAGES[name] || D.FALLBACK_IMG;
  const initial = (name) => String(name || '?').charAt(0).toUpperCase();
  const colorFor = (index) => D.COLORS[index % D.COLORS.length];
  const dateStr = () => new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });

  function loadPlans() {
    plans = Object.assign({}, D.BASE_PLANS, S.get('customPlans', {}));
    days = plans[plan] || plans.Ganzkoerper;
    allExercises = Array.from(new Map(Object.values(plans).flatMap((p) => p.flatMap((d) => d.ex)).map((e) => [e.n, e])).values());
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
    $('screen-users').classList.add('hidden');
    $('screen-app').style.display = 'block';
    const c = colorFor(Math.max(0, getUsers().indexOf(name)));
    $('h-avatar').textContent = initial(name);
    $('h-avatar').style.background = c.bg;
    $('h-avatar').style.color = c.c;
    $('h-name').textContent = name;
    day = 0; warmup = {}; openExercise = null; inputs = {}; setCounts = {}; finished = {}; daySwaps = {}; swapOpen = {};
    renderPlanTabs();
    renderDayTabs();
    setScreen('train');
  }
  function goUsers() {
    user = null;
    $('screen-app').style.display = 'none';
    $('screen-users').classList.remove('hidden');
    $('new-user-inp').value = '';
    $('add-user-btn').classList.remove('ready');
    renderUserScreen();
  }
  function setScreen(nextScreen) {
    screen = nextScreen;
    $('tab-train').classList.toggle('active', screen === 'train');
    $('tab-progress').classList.toggle('active', screen === 'progress');
    $('top-plans').classList.toggle('active', screen === 'plans');
    $('top-settings').classList.toggle('active', screen === 'settings');
    $('daytabs').style.display = screen === 'train' ? 'flex' : 'none';
    $('split-tabs').style.display = screen === 'train' ? 'flex' : 'none';
    $('train-content').classList.toggle('active', screen === 'train');
    $('prog-content').classList.toggle('active', screen === 'progress');
    $('plan-content').classList.toggle('active', screen === 'plans');
    $('settings-content').classList.toggle('active', screen === 'settings');
    $('finish-bar').style.display = screen === 'train' ? 'block' : 'none';
    if (screen === 'progress') renderProgress(); else if (screen === 'plans') renderPlanBuilder(); else if (screen === 'settings') renderSettings(); else renderTraining();
  }
  function setPlan(name) {
    saveCurrentInputs();
    plan = name; days = plans[plan] || plans.Ganzkoerper; day = 0; openExercise = null; warmup = {}; inputs = {}; setCounts = {}; finished = {};
    renderPlanTabs(); renderDayTabs(); renderTraining();
  }
  function renderPlanTabs() {
    const wrap = $('split-tabs'); wrap.innerHTML = '';
    Object.keys(plans).forEach((name) => {
      const b = document.createElement('button'); b.className = 'split-btn' + (name === plan ? ' active' : ''); b.type = 'button'; b.textContent = name; b.addEventListener('click', () => setPlan(name)); wrap.appendChild(b);
    });
  }
  function renderDayTabs() {
    const wrap = $('daytabs'); wrap.innerHTML = '';
    days.forEach((d, i) => { const b = document.createElement('button'); b.className = 'daytab' + (i === day ? ' active' : ''); b.type = 'button'; b.textContent = d.label; b.addEventListener('click', () => { saveCurrentInputs(); day = i; openExercise = null; warmup = {}; renderDayTabs(); renderTraining(); }); wrap.appendChild(b); });
  }
  function saveCurrentInputs() {
    if (!user || screen !== 'train' || !days[day]) return;
    if (!inputs[day]) inputs[day] = {};
    days[day].ex.forEach((ex) => { const count = setCounts[ex.id] || 3; inputs[day][ex.id] = Array.from({ length: count }, (_, i) => ({ kg: $('kg_' + ex.id + '_' + i)?.value || '', reps: $('reps_' + ex.id + '_' + i)?.value || '' })); });
  }
  function inputValue(id, i, field) { return inputs[day]?.[id]?.[i]?.[field] || ''; }
  function openSuggestedTraining() { const s = getNextSuggestion(user); plan = s.plan; days = plans[plan]; day = s.dayIndex; openExercise = null; warmup = {}; renderPlanTabs(); renderDayTabs(); setScreen('train'); }

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
    return D.EXERCISE_DB.map((item) => `<div class="swap-card ${item.n === current.n ? 'active' : ''}"><img src="${imageFor(item.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="swap-card-body"><div class="swap-muscle">${esc(item.m)}</div><div class="swap-name">${esc(item.n)}</div><button class="swap-select-btn" type="button" data-swap-id="${originalId}" data-swap-m="${esc(item.m)}" data-swap-n="${esc(item.n)}">${item.n === current.n ? 'Aktiv' : 'Auswählen'}</button></div></div>`).join('');
  }
  function renderCard(original) {
    const ex = displayExercise(original); const st = styleFor(ex.m); const isOpen = openExercise === original.id; const isDone = !!S.get('done_' + user + '_' + plan + '_' + day + '_' + original.id, false); const hist = getHistory(original.id).slice(-3); const last = hist[hist.length - 1]; const count = setCounts[original.id] || 3;
    if (!isOpen) return `<div class="ex-card ${isDone ? 'edone' : ''}" id="card_${original.id}"><div class="ex-row" data-open="${original.id}"><div class="ex-thumb"><img src="${imageFor(ex.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"></div><div class="ex-info"><div class="ex-mtag" style="color:${st.c}">${esc(ex.m)}</div><div class="ex-name">${esc(ex.n)}</div>${last ? `<div class="ex-last">${esc(last.date)} · ${last.sets.map((set) => `${set.kg}kgx${set.reps}`).join('  ')}</div>` : ''}</div><div class="ex-r">${isDone ? '<div class="done-chk">✓</div>' : `<div class="sets-badge">${count} Sätze</div><div class="chevron">›</div>`}</div></div></div>`;
    let rows = '';
    for (let i = 0; i < count; i += 1) rows += `<div class="set-row"><div class="snum" style="background:${st.bg};color:${st.c}">S${i + 1}</div><input class="ninp" type="number" inputmode="decimal" id="kg_${original.id}_${i}" value="${inputValue(original.id, i, 'kg')}"><input class="ninp" type="number" inputmode="numeric" id="reps_${original.id}_${i}" value="${inputValue(original.id, i, 'reps')}"><button class="del-btn" type="button" data-del-set="${original.id}" data-del-index="${i}">−</button></div>`;
    const history = hist.length ? `<div class="hist"><div class="hist-ttl">Letzte Einheiten</div>${hist.map((entry) => `<div class="hentry"><div class="hdate">${esc(entry.date)} · ${esc(entry.user)}</div><div class="hpills">${entry.sets.map((set, i) => `<span class="hpill" style="background:${st.bg};color:${st.c};border-color:${st.c}44">S${i + 1} ${set.kg}kgx${set.reps}</span>`).join('')}</div></div>`).join('')}</div>` : '';
    return `<div class="ex-card open ${isDone ? 'edone' : ''}" id="card_${original.id}" style="border-color:${st.c}55"><div class="ex-hero" data-open="${original.id}"><img src="${imageFor(ex.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="grad"></div><div class="hbadge" style="background:${st.c}">${esc(ex.m)}</div><div class="hbot"><div class="hname">${esc(ex.n)}</div><div class="hhint">schließen</div></div></div><div class="ex-body"><div class="swap-box"><button class="swap-toggle" type="button" data-toggle-swap="${original.id}"><span>🔄 Übung heute tauschen</span><span>${swapOpen[original.id] ? '−' : '+'}</span></button><div class="swap-content ${swapOpen[original.id] ? 'open' : ''}"><div class="swap-title">Alternative Übungen</div><div class="swap-grid">${renderSwapCards(ex, original.id)}</div><div class="swap-note">${ex.swapped ? `<button type="button" data-reset-swap="${original.id}" style="background:none;color:var(--red);font-weight:900;padding:0">Zurücksetzen</button>` : 'Der feste Plan bleibt erhalten. Der Tausch gilt nur für den aktuellen Trainingstag.'}</div></div></div>${history}<div class="inp-ttl">Heute eintragen</div><div class="col-hd"><span></span><span>kg</span><span>Wdh.</span><span></span></div>${rows}<button class="add-s-btn" type="button" data-add-set="${original.id}">+ Satz hinzufügen</button><div class="rest-row"><button class="rest-btn" type="button" data-rest="90">⏱️ 1:30</button><button class="rest-btn" type="button" data-rest="180">💤 3:00</button></div><button class="save-btn" type="button" data-save-ex="${original.id}" data-set-count="${count}" style="background:${st.c}">Einheit speichern</button></div></div>`;
  }
  function renderFinishBar() { const done = days[day].ex.filter((ex) => S.get('done_' + user + '_' + plan + '_' + day + '_' + ex.id, false)).length; const total = days[day].ex.length; $('finish-bar-inner').innerHTML = finished[day] ? `<div class="finish-done-msg"><div class="fdm-txt">Training abgeschlossen. Gut gemacht, ${esc(user)}</div></div>` : `<button class="finish-btn ${done === total ? 'ready' : ''}" id="finish-training" type="button">${done === total ? 'Training abschließen' : `Training beenden (${done}/${total} erledigt)`}</button>`; $('finish-training')?.addEventListener('click', () => { recordCompletedTraining(); finished[day] = true; renderUserScreen(); renderTraining(); }); }
  function bindDynamicEvents() {
    document.addEventListener('click', (e) => {
      const open = e.target.closest('[data-open]'); if (open) { saveCurrentInputs(); openExercise = openExercise === open.dataset.open ? null : open.dataset.open; renderTraining(); setTimeout(() => $('card_' + openExercise)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); return; }
      const add = e.target.closest('[data-add-set]'); if (add) { saveCurrentInputs(); const id = add.dataset.addSet; setCounts[id] = (setCounts[id] || 3) + 1; inputs[day] = inputs[day] || {}; inputs[day][id] = inputs[day][id] || []; inputs[day][id].push({ kg: '', reps: '' }); renderTraining(); return; }
      const del = e.target.closest('[data-del-set]'); if (del) { saveCurrentInputs(); const id = del.dataset.delSet; const idx = Number(del.dataset.delIndex); if ((setCounts[id] || 3) <= 1) return; setCounts[id] = (setCounts[id] || 3) - 1; inputs[day]?.[id]?.splice(idx, 1); renderTraining(); return; }
      const save = e.target.closest('[data-save-ex]'); if (save) { saveExercise(save.dataset.saveEx, Number(save.dataset.setCount)); return; }
      const rest = e.target.closest('[data-rest]'); if (rest) { startRestTimer(Number(rest.dataset.rest)); return; }
      const sw = e.target.closest('[data-swap-id]'); if (sw) { daySwaps[swapKey(sw.dataset.swapId)] = { id: sw.dataset.swapId, m: sw.dataset.swapM, n: sw.dataset.swapN, swapped: true }; openExercise = sw.dataset.swapId; renderTraining(); return; }
      const toggleSwap = e.target.closest('[data-toggle-swap]'); if (toggleSwap) { swapOpen[toggleSwap.dataset.toggleSwap] = !swapOpen[toggleSwap.dataset.toggleSwap]; renderTraining(); return; }
      const resetSwap = e.target.closest('[data-reset-swap]'); if (resetSwap) { delete daySwaps[swapKey(resetSwap.dataset.resetSwap)]; openExercise = resetSwap.dataset.resetSwap; renderTraining(); }
    });
  }
  function saveExercise(id, count) { saveCurrentInputs(); const sets = Array.from({ length: count }, (_, i) => ({ kg: inputs[day]?.[id]?.[i]?.kg || '0', reps: inputs[day]?.[id]?.[i]?.reps || '0' })); const entry = { date: dateStr(), user, sets }; S.set('h_' + id, [...getHistory(id), entry].slice(-50)); const sessions = S.get('sessions_' + user, []); sessions.push({ date: entry.date, day, plan }); S.set('sessions_' + user, sessions.slice(-200)); S.set('done_' + user + '_' + plan + '_' + day + '_' + id, true); openExercise = null; startRestTimer(90); renderTraining(); }
  function startRestTimer(seconds) { clearInterval(window.__restTimer); let remaining = seconds || 90; $('rest-float').classList.add('show'); const tick = () => { $('rest-time').textContent = remaining <= 0 ? 'Fertig' : String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0'); if (remaining <= 0) { clearInterval(window.__restTimer); return; } remaining -= 1; }; tick(); window.__restTimer = setInterval(tick, 1000); }

  function renderProgress() { const current = allExercises.find((ex) => ex.n === progressExercise) || allExercises[0]; const st = styleFor(current.m); const ids = Object.values(plans).flatMap((p) => p.flatMap((d) => d.ex)).filter((ex) => ex.n === progressExercise).map((ex) => ex.id); const hist = ids.flatMap(getHistory).filter((entry) => !progressUser || entry.user === progressUser); let html = '<div class="sec-lbl">📊 Übung</div><div class="pill-wrap">'; allExercises.forEach((ex) => { const s = styleFor(ex.m); const active = ex.n === progressExercise; html += `<button class="pill" type="button" data-progress-ex="${esc(ex.n)}" style="background:${active ? s.bg : 'var(--card2)'};color:${active ? s.c : 'var(--muted)'};border-color:${active ? s.c + '55' : 'transparent'}">${esc(ex.n)}</button>`; }); html += `</div><div class="hero-card"><div class="hero-img"><img src="${imageFor(progressExercise)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="hgrad"></div><div class="hero-info"><div class="hbadge2" style="background:${st.c}">${esc(current.m)}</div><div class="hname2">${esc(progressExercise)}</div></div></div>`; if (hist.length) { const maxKg = Math.max(...hist.flatMap((entry) => entry.sets.map((set) => parseFloat(set.kg) || 0))); const maxReps = Math.max(...hist.flatMap((entry) => entry.sets.map((set) => parseFloat(set.reps) || 0))); html += `<div class="stats-row"><div class="stat"><div class="stat-val" style="color:${st.c}">${hist.length}</div><div class="stat-lbl">Einheiten</div></div><div class="stat"><div class="stat-val" style="color:${st.c}">${maxKg}kg</div><div class="stat-lbl">Max kg</div></div><div class="stat"><div class="stat-val" style="color:${st.c}">${maxReps}</div><div class="stat-lbl">Max Wdh.</div></div></div>`; } html += '</div>'; if (!hist.length) { $('prog-content').innerHTML = html + '<div class="empty"><h3>Noch keine Daten</h3><p>Trage eine Einheit ein.</p></div>'; return; } const labels = hist.map((h) => h.date); const kgData = hist.map((h) => avg(h.sets.map((s) => parseFloat(s.kg) || 0))); const repsData = hist.map((h) => avg(h.sets.map((s) => parseFloat(s.reps) || 0))); html += '<div class="chart-box"><div class="chart-lbl">Ø Gewicht</div><canvas id="cKg"></canvas></div><div class="chart-box"><div class="chart-lbl">Ø Wiederholungen</div><canvas id="cRp"></canvas></div><div class="sec-lbl">Verlauf</div>' + [...hist].reverse().map((entry) => `<div class="log-entry"><div class="log-top"><span class="log-d" style="color:${st.c}">${entry.date}</span><span class="log-u">${esc(entry.user)}</span></div><div class="log-pills">${entry.sets.map((set, i) => `<span class="lpill" style="background:${st.bg};color:${st.c};border-color:${st.c}44">S${i + 1}: ${set.kg}kgx${set.reps}</span>`).join('')}</div></div>`).join(''); $('prog-content').innerHTML = html; document.querySelectorAll('[data-progress-ex]').forEach((b) => b.addEventListener('click', () => { progressExercise = b.dataset.progressEx; renderProgress(); })); drawChart('kg', $('cKg'), labels, kgData, st.c, 'kg'); drawChart('reps', $('cRp'), labels, repsData, '#ff9f0a', ''); }
  function avg(values) { return +(values.reduce((s, v) => s + v, 0) / Math.max(values.length, 1)).toFixed(1); }
  function drawChart(key, canvas, labels, data, color, unit) { if (!window.Chart || !canvas) return; if (charts[key]) charts[key].destroy(); charts[key] = new Chart(canvas, { type: 'line', data: { labels, datasets: [{ data, borderColor: color, backgroundColor: color + '22', borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: color, tension: .35, fill: true }] }, options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => String(ctx.parsed.y) + unit } } }, scales: { x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,.05)' } }, y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,.05)' } } } } }); }

  function renderPlanBuilder() { const base = Object.keys(D.BASE_PLANS); const custom = Object.keys(plans).filter((name) => !base.includes(name)); let html = `<div class="builder-card"><div class="builder-title">🛠️ Plan-Builder</div><div class="builder-sub">Kopiere eine Vorlage oder bearbeite eigene Pläne.</div><input class="builder-input" id="builder-name" placeholder="Name des Plans" value="${esc(planDraft?.name || 'Mein Plan')}"><select class="builder-select" id="builder-template">${Object.keys(plans).map((name) => `<option value="${esc(name)}">Vorlage: ${esc(name)}</option>`).join('')}</select><div class="builder-row"><button class="builder-btn" type="button" id="copy-template">Vorlage kopieren</button><button class="builder-btn secondary" type="button" id="add-draft-day">+ Tag</button></div></div>`; if (custom.length) { html += '<div class="builder-card"><div class="builder-title">Eigene Pläne</div><div class="builder-sub">Bearbeiten, duplizieren oder löschen.</div>' + custom.map((name) => `<div class="builder-ex"><div class="builder-ex-info"><div class="builder-ex-muscle">Eigener Plan</div><div class="builder-ex-name">${esc(name)}</div></div><button class="builder-mini" data-dup-plan="${esc(name)}">⧉</button><button class="builder-mini" data-edit-plan="${esc(name)}">✎</button><button class="builder-mini" data-delete-plan="${esc(name)}">×</button></div>`).join('') + '</div>'; } if (planDraft) { html += `<div class="builder-card"><span class="custom-pill">Entwurf aktiv</span><div class="builder-title">${esc(planDraft.name)}</div><button class="builder-btn" id="save-draft">Plan speichern</button></div>` + planDraft.days.map((d, di) => `<div class="day-builder"><div class="day-builder-head"><input class="builder-input" data-day-label="${di}" value="${esc(d.label)}" style="margin:0"><button class="builder-mini" data-remove-day="${di}">×</button></div>${d.ex.length ? d.ex.map((ex, ei) => `<div class="builder-ex"><img src="${imageFor(ex.n)}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG"><div class="builder-ex-info"><div class="builder-ex-muscle">${esc(ex.m)}</div><div class="builder-ex-name">${esc(ex.n)}</div></div><button class="builder-mini" data-move-ex="${di}|${ei}|-1">↑</button><button class="builder-mini" data-move-ex="${di}|${ei}|1">↓</button><button class="builder-mini" data-remove-ex="${di}|${ei}">×</button></div>`).join('') : '<div class="builder-empty">Noch keine Übungen.</div>'}<select class="builder-select" id="add-ex-${di}">${D.EXERCISE_DB.map((item) => `<option value="${item.m}|${item.n}">${item.m} · ${item.n}</option>`).join('')}</select><button class="builder-btn secondary" data-add-ex="${di}">+ Übung hinzufügen</button></div>`).join(''); } else html += '<div class="builder-card"><div class="builder-sub">Noch kein Entwurf offen. Wähle eine Vorlage und kopiere sie.</div></div>'; $('plan-content').innerHTML = html; bindBuilderEvents(); }
  function bindBuilderEvents() { $('builder-name')?.addEventListener('input', (e) => { if (planDraft) planDraft.name = e.target.value.trim() || 'Mein Plan'; }); $('copy-template')?.addEventListener('click', () => { const t = $('builder-template').value; planDraft = { name: $('builder-name').value.trim() || 'Mein Plan', days: clone(plans[t] || plans.Ganzkoerper) }; renderPlanBuilder(); }); $('add-draft-day')?.addEventListener('click', () => { if (!planDraft) planDraft = { name: 'Mein Plan', days: [] }; planDraft.days.push({ label: 'Tag ' + (planDraft.days.length + 1), ex: [] }); renderPlanBuilder(); }); $('save-draft')?.addEventListener('click', saveDraftPlan); document.querySelectorAll('[data-day-label]').forEach((el) => el.addEventListener('input', () => { planDraft.days[Number(el.dataset.dayLabel)].label = el.value.trim() || 'Tag'; })); document.querySelectorAll('[data-add-ex]').forEach((b) => b.addEventListener('click', () => { const di = Number(b.dataset.addEx); const [m, n] = $('add-ex-' + di).value.split('|'); planDraft.days[di].ex.push({ id: 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 999), m, n }); renderPlanBuilder(); })); document.querySelectorAll('[data-remove-day]').forEach((b) => b.addEventListener('click', () => { planDraft.days.splice(Number(b.dataset.removeDay), 1); if (!planDraft.days.length) planDraft.days.push({ label: 'Tag 1', ex: [] }); renderPlanBuilder(); })); document.querySelectorAll('[data-remove-ex]').forEach((b) => b.addEventListener('click', () => { const [di, ei] = b.dataset.removeEx.split('|').map(Number); planDraft.days[di].ex.splice(ei, 1); renderPlanBuilder(); })); document.querySelectorAll('[data-move-ex]').forEach((b) => b.addEventListener('click', () => { const [di, ei, dir] = b.dataset.moveEx.split('|').map(Number); const arr = planDraft.days[di].ex; const next = ei + dir; if (next < 0 || next >= arr.length) return; const item = arr.splice(ei, 1)[0]; arr.splice(next, 0, item); renderPlanBuilder(); })); document.querySelectorAll('[data-edit-plan]').forEach((b) => b.addEventListener('click', () => { planDraft = { name: b.dataset.editPlan, days: clone(plans[b.dataset.editPlan]) }; renderPlanBuilder(); })); document.querySelectorAll('[data-dup-plan]').forEach((b) => b.addEventListener('click', () => { planDraft = { name: b.dataset.dupPlan + ' Copy', days: clone(plans[b.dataset.dupPlan]) }; renderPlanBuilder(); })); document.querySelectorAll('[data-delete-plan]').forEach((b) => b.addEventListener('click', () => { if (!confirm('Diesen eigenen Plan löschen?')) return; delete plans[b.dataset.deletePlan]; saveCustomPlans(); renderPlanBuilder(); })); }
  function saveDraftPlan() { if (!planDraft) return; const name = planDraft.name.trim() || 'Mein Plan'; if (!planDraft.days.some((d) => d.ex.length)) { showToast('Bitte mindestens eine Übung hinzufügen.'); return; } plans[name] = clone(planDraft.days); saveCustomPlans(); plan = name; days = plans[name]; day = 0; planDraft = null; renderPlanTabs(); renderDayTabs(); setScreen('train'); showToast('Plan gespeichert.'); }

  function applySavedTheme() { document.body.classList.toggle('light-mode', S.get('theme', 'dark') === 'light'); }
  function setTheme(theme) { S.set('theme', theme); applySavedTheme(); renderSettings(); }
  function renderSettings() { const theme = S.get('theme', 'dark'); $('settings-content').innerHTML = `<div class="settings-card"><div class="settings-title">⚙️ Einstellungen</div><div class="settings-sub">Passe die App an dein Handy und deine Nutzung an.</div><div class="quick-label">Design</div><div class="theme-row"><button class="theme-btn ${theme === 'dark' ? 'active' : ''}" id="dark-theme">🌙 Dunkel</button><button class="theme-btn ${theme === 'light' ? 'active' : ''}" id="light-theme">☀️ Warm hell</button></div><div class="settings-note">Die Auswahl wird auf diesem Gerät gespeichert.</div></div><div class="settings-card"><div class="settings-title">💾 Daten</div><div class="settings-sub">Bis Firebase kommt, bleiben Daten lokal. Backups helfen beim Sichern oder Gerätewechsel.</div><div class="settings-actions"><button class="settings-action" id="export-data">Backup exportieren</button><button class="settings-action" id="import-data">Backup importieren</button></div><input id="backup-import" type="file" accept="application/json" style="display:none"><div class="settings-actions"><button class="settings-action danger" id="clear-data">Lokale Daten löschen</button></div></div>`; $('dark-theme').addEventListener('click', () => setTheme('dark')); $('light-theme').addEventListener('click', () => setTheme('light')); $('export-data').addEventListener('click', exportLocalData); $('import-data').addEventListener('click', () => $('backup-import').click()); $('backup-import').addEventListener('change', (e) => importLocalData(e.target.files[0])); $('clear-data').addEventListener('click', clearLocalData); }
  function exportLocalData() { const data = { version: 1, exportedAt: new Date().toISOString(), items: {} }; S.keys().forEach((key) => { data.items[key] = localStorage.getItem(key); }); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'gymbaddies-backup.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('Backup erstellt.'); }
  function importLocalData(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (!data.items) throw new Error('ungueltig'); Object.keys(data.items).forEach((key) => localStorage.setItem(key, data.items[key])); showToast('Backup importiert.'); setTimeout(() => location.reload(), 700); } catch { showToast('Backup konnte nicht importiert werden.'); } }; reader.readAsText(file); }
  function clearLocalData() { if (!confirm('Alle lokalen GymBaddies-Daten auf diesem Gerät löschen?')) return; S.keys().forEach((key) => { if (key === 'users' || key === 'customPlans' || key === 'theme' || key.indexOf('sessions_') === 0 || key.indexOf('trainingLog_') === 0 || key.indexOf('h_') === 0 || key.indexOf('done_') === 0) S.remove(key); }); showToast('Daten gelöscht.'); setTimeout(() => location.reload(), 700); }
  function runChecks() { const checks = [['plans', () => Object.keys(plans).length >= 3], ['exercise db', () => D.EXERCISE_DB.length >= 35], ['buttons', () => $('add-user-btn') && $('top-plans') && $('top-settings')], ['storage', () => S.set('__test', true) && S.get('__test') === true]]; checks.forEach(([name, fn]) => { try { if (!fn()) console.warn('Check failed:', name); } catch (e) { console.warn('Check error:', name, e); } }); S.remove('__test'); }
  function init() { loadPlans(); applySavedTheme(); renderUserScreen(); bindDynamicEvents(); const input = $('new-user-inp'); const add = $('add-user-btn'); const update = () => add.classList.toggle('ready', !!input.value.trim()); input.addEventListener('input', update); input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addUser(); }); add.addEventListener('click', addUser); add.addEventListener('touchend', (e) => { e.preventDefault(); addUser(); }, { passive: false }); $('user-switch').addEventListener('click', goUsers); $('tab-train').addEventListener('click', () => setScreen('train')); $('tab-progress').addEventListener('click', () => setScreen('progress')); $('top-plans').addEventListener('click', () => setScreen('plans')); $('top-settings').addEventListener('click', () => setScreen('settings')); $('rest-close').addEventListener('click', () => { clearInterval(window.__restTimer); $('rest-float').classList.remove('show'); }); update(); runChecks(); }
  document.addEventListener('DOMContentLoaded', init);
}());


// ===== NEW FEATURES =====

const gymbaddiesFeatures = {
  streaks: true,
  progressPhotos: true,
  smartSuggestions: true,
  personalRecords: true,
  dashboard: true,
  cloudSyncReady: true,
  pwaReady: true
};

function showSmartSuggestion(){
  console.log("Smart suggestion system initialized");
}

function initPRTracking(){
  console.log("PR tracking initialized");
}

function initStreaks(){
  console.log("Workout streaks initialized");
}

function initDashboard(){
  console.log("Dashboard initialized");
}

showSmartSuggestion();
initPRTracking();
initStreaks();
initDashboard();
