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
  let daySwaps = {}, swapOpen = {}, editMode = {};
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
      // App shell
      appName: 'GymBaddies',
      whoTrains: 'Wer trainiert heute?',
      newProfile: 'Neuer Name',
      addBtn: '+',
      addHint: 'Button wird rot sobald ein Name eingetragen ist.',
      // Nav
      navHome: '🏠 Home', navTrain: '🏋️ Training', navProgress: '📈 Fortschritt',
      navPlans: '🛠️ Pläne', menuPlans: '🛠️ Pläne',
      // Home
      greeting: 'Hi {name} 👋',
      lastTraining: 'Zuletzt: {plan} · {label} am {date}',
      noTrainingYet: 'Noch kein Training abgeschlossen.',
      pinnedPlans: 'Angeheftete Pläne',
      lastWorkout: 'Letztes Training',
      personalRecords: 'Persönliche Rekorde',
      startBtn: '{label} →',
      thisWeek: 'Diese Woche', total: 'Gesamt', volume: 'Volumen',
      // Training
      warmUp: '🔥 Warm-Up',
      gymSection: '💪 {plan} · {label}',
      suggestion: '⚡ Vorschlag',
      suggestionActive: 'Aktiv ✓',
      openSuggestion: 'Öffnen →',
      lastSession: 'Zuletzt: {plan} · {label} am {date}',
      noLastSession: 'Noch kein Training.',
      historyLabel: 'Letzte Einheiten',
      enterToday: 'Heute eintragen',
      fillLast: 'Letzte Werte übernommen.',
      noHistory: 'Noch keine gespeicherten Werte.',
      addSet: '+ Satz hinzufügen',
      swapExercise: '🔄 Übung tauschen',
      resetSwap: 'Zurücksetzen ↺',
      closeCard: '',
      selectExercise: 'Wählen',
      activeExercise: '✓ Aktiv',
      rest90: '⏱ 1:30', rest180: '💤 3:00',
      fillLastBtn: '↩ Letzte Werte',
      progressBtn: '📊 Fortschritt',
      setsSaved: 'Einheit gespeichert',
      saveSession: 'Einheit speichern',
      editSession: 'Einheit bearbeiten',
      savedBadge: 'Gespeichert',
      exerciseSwapped: 'Übung getauscht.',
      restRunning: 'Pause',
      // Finish
      finishBtn: 'Training beenden ({done}/{total})',
      finishReady: '🎉 Abschließen',
      confirmFinish: 'Training wirklich abschließen?',
      stillOpen: 'Noch {n} Übung(en) offen.',
      allDone: 'Alle Übungen erledigt!',
      yesFinish: 'Abschließen',
      cancel: 'Abbrechen',
      trainingSaved: 'Training gespeichert! Weiter so',
      trainingSavedFull: '🎉 Training abgeschlossen! Weiter so, {name}!',
      // Progress
      selectExerciseLabel: '📊 Übung wählen',
      sessions: 'Einheiten', maxKg: 'Max kg', volLabel: 'Volumen',
      logLabel: 'Verlauf',
      noData: 'Noch keine Daten', noDataDesc: 'Trage eine Einheit ein.',
      // Plans
      planLibTitle: '📚 Planbibliothek',
      planLibDesc: 'Hefte Pläne an, bearbeite oder erstelle eigene.',
      newPlanTitle: '➕ Neuen Plan erstellen',
      planNamePlaceholder: 'Name des Plans',
      startBlank: 'Leer starten',
      addDay: '+ Tag hinzufügen',
      copyTemplate: 'Vorlage kopieren',
      pinBtn: 'Anheften', unpinBtn: 'Lösen',
      duplicate: 'Duplizieren',
      editPlan: 'Bearbeiten',
      copyEdit: 'Kopie bearbeiten',
      deletePlan: 'Plan löschen',
      deletePlanConfirm: 'Plan "{name}" löschen?',
      draftActive: '✏️ Entwurf aktiv',
      saveDraft: 'Plan speichern ✓',
      addExerciseToDay: '+ Übung hinzufügen',
      addCustomToDay: '+ Eigene Übung',
      customExTitle: '💪 Eigene Übung',
      customExDesc: 'Füge eine Übung zur Datenbank hinzu.',
      uploadImage: '📷 Bild hochladen',
      exerciseSaved: 'Übung gespeichert.',
      // Settings
      settingsTitle: 'Einstellungen',
      designLabel: 'Design', dark: '🌙 Dunkel', light: '☀️ Hell',
      langLabel: 'Sprache', profilesLabel: 'Profile',
      menuSettings: 'Einstellungen', menuSwitchProfile: 'Profil wechseln', activeProfile: 'Aktiv',
      deleteProfile: 'Löschen',
      exerciseDBLabel: 'Übungsdatenbank bearbeiten',
      cloudLabel: '☁️ Cloud-Sync',
      cloudConnected: 'Online',
      cloudOffline: 'Offline',
      statusOnline: 'Online',
      statusOffline: 'Offline',
      planSearch: 'Pläne suchen…',
      swapFilterAll: 'Alle Muskelgruppen',
      addExercise: 'Übung hinzufügen',
      back: '← Zurück',
      // Misc
      noPlanTitle: 'Kein Plan ausgewählt',
      noPlanDesc: 'Hefte dir in der Planbibliothek einen Plan an – er erscheint dann hier.',
      pinPlan: 'Plan anheften',
      langSaved: 'Sprache gespeichert.',
      profileDeleted: 'Profil gelöscht.',
      deleteConfirm: 'Profil "{name}" wirklich löschen? Alle Trainingsdaten werden entfernt.',
      noLastProfile: 'Das letzte Profil kann nicht gelöscht werden.',
      confirmDeleteShort: '⚠️ Wirklich löschen?',
      exerciseDeleted: 'Übung gelöscht.',
      renamedTo: 'Umbenannt.',
      imageSaved: 'Bild aktualisiert.',
      planSaved: 'Plan gespeichert.',
      newPR: 'Neue PR: ',
      nameRequired: 'Bitte Namen eintragen.',
      atLeastOneEx: 'Mindestens eine Übung pro Tag hinzufügen.',
      sessions1: 'Einheit', sessionsN: 'Einheiten',
      days: 'Tage', exercises: 'Übungen', template: '· Vorlage',
      noExercises: 'Noch keine Übungen.',
      exerciseName: 'Übungsname',
      deleteExerciseConfirm: 'Übung "{name}" löschen?',
      repsPlaceholder: 'Wdh',
      repsHeader: 'Wdh.',
      avgWeight: 'Ø Gewicht (kg)', avgReps: 'Ø Wiederholungen', pinnedTag: '📌 Angeheftet', imageUrlPlaceholder: 'Bild-URL (optional)', removeDayTitle: 'Tag entfernen', moveUpTitle: 'Nach oben', moveDownTitle: 'Nach unten', removeTitle: 'Entfernen', uploadShort: 'Hochladen', imageTitle: 'Bild', deleteTitle: 'Löschen',
      timerDone: 'Fertig ✓',
      noPlanShort: 'Keinen Plan gefunden.',
      activePercent: '% abgeschlossen',
      openTraining: '⬆︎ Training öffnen',
      noExercisesDB: 'Keine Übungen vorhanden.',
      vorlage: '· Vorlage',
    },
    en: {
      appName: 'GymBaddies',
      whoTrains: 'Who is training today?',
      newProfile: 'New name',
      addBtn: '+',
      addHint: 'Button turns red once a name is entered.',
      navHome: '🏠 Home', navTrain: '🏋️ Training', navProgress: '📈 Progress',
      navPlans: '🛠️ Plans', menuPlans: '🛠️ Plans',
      greeting: 'Hi {name} 👋',
      lastTraining: 'Last: {plan} · {label} on {date}',
      noTrainingYet: 'No training completed yet.',
      pinnedPlans: 'Pinned Plans',
      lastWorkout: 'Last Workout',
      personalRecords: 'Personal Records',
      startBtn: '{label} →',
      thisWeek: 'This Week', total: 'Total', volume: 'Volume',
      warmUp: '🔥 Warm-Up',
      gymSection: '💪 {plan} · {label}',
      suggestion: '⚡ Suggestion',
      suggestionActive: 'Active ✓',
      openSuggestion: 'Open →',
      lastSession: 'Last: {plan} · {label} on {date}',
      noLastSession: 'No training yet.',
      historyLabel: 'Recent Sessions',
      enterToday: 'Log today',
      fillLast: 'Last values loaded.',
      noHistory: 'No saved values yet.',
      addSet: '+ Add set',
      swapExercise: '🔄 Swap exercise',
      resetSwap: 'Reset ↺',
      closeCard: '',
      selectExercise: 'Select',
      activeExercise: '✓ Active',
      rest90: '⏱ 1:30', rest180: '💤 3:00',
      fillLastBtn: '↩ Last values',
      progressBtn: '📊 Progress',
      setsSaved: 'Session saved',
      saveSession: 'Save session',
      editSession: 'Edit session',
      savedBadge: 'Saved',
      exerciseSwapped: 'Exercise swapped.',
      restRunning: 'Rest',
      finishBtn: 'End training ({done}/{total})',
      finishReady: '🎉 Finish',
      confirmFinish: 'Really finish training?',
      stillOpen: '{n} exercise(s) still open.',
      allDone: 'All exercises done!',
      yesFinish: 'Finish',
      cancel: 'Cancel',
      trainingSaved: 'Training saved! Well done',
      trainingSavedFull: '🎉 Training done! Well done, {name}!',
      selectExerciseLabel: '📊 Select exercise',
      sessions: 'Sessions', maxKg: 'Max kg', volLabel: 'Volume',
      logLabel: 'History',
      noData: 'No data yet', noDataDesc: 'Log a session to see progress.',
      planLibTitle: '📚 Plan Library',
      planLibDesc: 'Pin, edit or create your own plans.',
      newPlanTitle: '➕ Create New Plan',
      planNamePlaceholder: 'Plan name',
      startBlank: 'Start blank',
      addDay: '+ Add day',
      copyTemplate: 'Copy template',
      pinBtn: 'Pin', unpinBtn: 'Unpin',
      duplicate: 'Duplicate',
      editPlan: 'Edit',
      copyEdit: 'Edit copy',
      deletePlan: 'Delete plan',
      deletePlanConfirm: 'Delete plan "{name}"?',
      draftActive: '✏️ Draft active',
      saveDraft: 'Save plan ✓',
      addExerciseToDay: '+ Add exercise',
      addCustomToDay: '+ Custom exercise',
      customExTitle: '💪 Custom Exercise',
      customExDesc: 'Add an exercise to the database.',
      uploadImage: '📷 Upload image',
      exerciseSaved: 'Exercise saved.',
      settingsTitle: 'Settings',
      designLabel: 'Design', dark: '🌙 Dark', light: '☀️ Light',
      langLabel: 'Language', profilesLabel: 'Profiles',
      menuSettings: 'Settings', menuSwitchProfile: 'Switch profile', activeProfile: 'Active',
      deleteProfile: 'Delete',
      exerciseDBLabel: 'Edit exercise database',
      cloudLabel: '☁️ Cloud Sync',
      cloudConnected: 'Online',
      cloudOffline: 'Offline',
      statusOnline: 'Online',
      statusOffline: 'Offline',
      planSearch: 'Search plans…',
      swapFilterAll: 'All muscle groups',
      addExercise: 'Add exercise',
      back: '← Back',
      noPlanTitle: 'No plan selected',
      noPlanDesc: 'Pin a plan in the plan library – it will appear here.',
      pinPlan: 'Pin plan',
      langSaved: 'Language saved.',
      profileDeleted: 'Profile deleted.',
      deleteConfirm: 'Really delete profile "{name}"? All training data will be removed.',
      noLastProfile: 'The last profile cannot be deleted.',
      confirmDeleteShort: '⚠️ Really delete?',
      exerciseDeleted: 'Exercise deleted.',
      renamedTo: 'Renamed.',
      imageSaved: 'Image updated.',
      planSaved: 'Plan saved.',
      newPR: 'New PR: ',
      nameRequired: 'Please enter a name.',
      atLeastOneEx: 'Add at least one exercise per day.',
      sessions1: 'session', sessionsN: 'sessions',
      days: 'days', exercises: 'exercises', template: '· Template',
      noExercises: 'No exercises yet.',
      exerciseName: 'Exercise name',
      deleteExerciseConfirm: 'Delete exercise "{name}"?',
      repsPlaceholder: 'Reps',
      repsHeader: 'Reps',
      avgWeight: 'Avg. weight (kg)', avgReps: 'Avg. reps', pinnedTag: '📌 Pinned', imageUrlPlaceholder: 'Image URL (optional)', removeDayTitle: 'Remove day', moveUpTitle: 'Move up', moveDownTitle: 'Move down', removeTitle: 'Remove', uploadShort: 'Upload', imageTitle: 'Image', deleteTitle: 'Delete',
      timerDone: 'Done ✓',
      noPlanShort: 'No plan found.',
      activePercent: '% done',
      openTraining: '⬆︎ Open training',
      noExercisesDB: 'No exercises found.',
      vorlage: '· Template',
    },
    th: {
      appName: 'GymBaddies',
      whoTrains: 'ใครออกกำลังกายวันนี้?',
      newProfile: 'ชื่อใหม่',
      addBtn: '+',
      addHint: 'ปุ่มจะเป็นสีแดงเมื่อกรอกชื่อ',
      navHome: '🏠 หน้าหลัก', navTrain: '🏋️ ฝึก', navProgress: '📈 ความก้าวหน้า',
      navPlans: '🛠️ แผน', menuPlans: '🛠️ แผน',
      greeting: 'สวัสดี {name} 👋',
      lastTraining: 'ล่าสุด: {plan} · {label} เมื่อ {date}',
      noTrainingYet: 'ยังไม่เคยฝึก',
      pinnedPlans: 'แผนที่ปักหมุด',
      lastWorkout: 'การฝึกล่าสุด',
      personalRecords: 'สถิติส่วนตัว',
      startBtn: '{label} →',
      thisWeek: 'สัปดาห์นี้', total: 'ทั้งหมด', volume: 'ปริมาณ',
      warmUp: '🔥 วอร์มอัพ',
      gymSection: '💪 {plan} · {label}',
      suggestion: '⚡ แนะนำ',
      suggestionActive: 'กำลังใช้ ✓',
      openSuggestion: 'เปิด →',
      lastSession: 'ล่าสุด: {plan} · {label} เมื่อ {date}',
      noLastSession: 'ยังไม่เคยฝึก',
      historyLabel: 'เซตล่าสุด',
      enterToday: 'บันทึกวันนี้',
      fillLast: 'โหลดค่าล่าสุดแล้ว',
      noHistory: 'ยังไม่มีค่าที่บันทึก',
      addSet: '+ เพิ่มเซต',
      swapExercise: '🔄 เปลี่ยนท่า',
      resetSwap: 'รีเซ็ต ↺',
      closeCard: '',
      selectExercise: 'เลือก',
      activeExercise: '✓ กำลังใช้',
      rest90: '⏱ 1:30', rest180: '💤 3:00',
      fillLastBtn: '↩ ค่าล่าสุด',
      progressBtn: '📊 ความก้าวหน้า',
      setsSaved: 'บันทึกเซตแล้ว',
      saveSession: 'บันทึกเซต',
      editSession: 'แก้ไขเซต',
      savedBadge: 'บันทึกแล้ว',
      exerciseSwapped: 'เปลี่ยนท่าแล้ว',
      restRunning: 'พัก',
      finishBtn: 'จบการฝึก ({done}/{total})',
      finishReady: '🎉 จบเลย',
      confirmFinish: 'จบการฝึกจริงไหม?',
      stillOpen: 'ยังเหลืออีก {n} ท่า',
      allDone: 'ทำครบทุกท่าแล้ว!',
      yesFinish: 'จบเลย',
      cancel: 'ยกเลิก',
      trainingSaved: 'บันทึกการฝึกแล้ว เก่งมาก',
      trainingSavedFull: '🎉 ฝึกเสร็จแล้ว! เก่งมาก {name}!',
      selectExerciseLabel: '📊 เลือกท่า',
      sessions: 'เซสชัน', maxKg: 'สูงสุด kg', volLabel: 'ปริมาณ',
      logLabel: 'ประวัติ',
      noData: 'ยังไม่มีข้อมูล', noDataDesc: 'บันทึกเซสชันเพื่อดูความก้าวหน้า',
      planLibTitle: '📚 คลังแผน',
      planLibDesc: 'ปักหมุด แก้ไข หรือสร้างแผนของตัวเอง',
      newPlanTitle: '➕ สร้างแผนใหม่',
      planNamePlaceholder: 'ชื่อแผน',
      startBlank: 'เริ่มเปล่า',
      addDay: '+ เพิ่มวัน',
      copyTemplate: 'คัดลอกเทมเพลต',
      pinBtn: 'ปักหมุด', unpinBtn: 'เอาออก',
      duplicate: 'ทำสำเนา',
      editPlan: 'แก้ไข',
      copyEdit: 'แก้ไขสำเนา',
      deletePlan: 'ลบแผน',
      deletePlanConfirm: 'ลบแผน "{name}" ไหม?',
      draftActive: '✏️ แบบร่างยังเปิดอยู่',
      saveDraft: 'บันทึกแผน ✓',
      addExerciseToDay: '+ เพิ่มท่า',
      addCustomToDay: '+ ท่าของตัวเอง',
      customExTitle: '💪 ท่าของตัวเอง',
      customExDesc: 'เพิ่มท่าลงฐานข้อมูล',
      uploadImage: '📷 อัปโหลดรูป',
      exerciseSaved: 'บันทึกท่าแล้ว',
      settingsTitle: 'การตั้งค่า',
      designLabel: 'ธีม', dark: '🌙 มืด', light: '☀️ สว่าง',
      langLabel: 'ภาษา', profilesLabel: 'โปรไฟล์',
      menuSettings: 'การตั้งค่า', menuSwitchProfile: 'เปลี่ยนโปรไฟล์', activeProfile: 'กำลังใช้',
      deleteProfile: 'ลบ',
      exerciseDBLabel: 'แก้ไขฐานข้อมูลท่า',
      cloudLabel: '☁️ คลาวด์ซิงค์',
      cloudConnected: 'ออนไลน์',
      cloudOffline: 'ออฟไลน์',
      statusOnline: 'ออนไลน์',
      statusOffline: 'ออฟไลน์',
      planSearch: 'ค้นหาแผน…',
      swapFilterAll: 'กล้ามเนื้อทั้งหมด',
      addExercise: 'เพิ่มท่า',
      back: '← กลับ',
      noPlanTitle: 'ยังไม่ได้เลือกแผน',
      noPlanDesc: 'ปักหมุดแผนในคลัง – แล้วมันจะปรากฏที่นี่',
      pinPlan: 'ปักหมุดแผน',
      langSaved: 'บันทึกภาษาแล้ว',
      profileDeleted: 'ลบโปรไฟล์แล้ว',
      deleteConfirm: 'ลบโปรไฟล์ "{name}" จริงไหม? ข้อมูลการฝึกทั้งหมดจะถูกลบ',
      noLastProfile: 'ไม่สามารถลบโปรไฟล์สุดท้ายได้',
      confirmDeleteShort: '⚠️ ลบจริงไหม?',
      exerciseDeleted: 'ลบท่าแล้ว',
      renamedTo: 'เปลี่ยนชื่อแล้ว',
      imageSaved: 'อัปเดตรูปแล้ว',
      planSaved: 'บันทึกแผนแล้ว',
      newPR: 'สถิติใหม่: ',
      nameRequired: 'กรุณาใส่ชื่อ',
      atLeastOneEx: 'เพิ่มอย่างน้อยหนึ่งท่าต่อวัน',
      sessions1: 'ครั้ง', sessionsN: 'ครั้ง',
      days: 'วัน', exercises: 'ท่า', template: '· เทมเพลต',
      noExercises: 'ยังไม่มีท่าออกกำลังกาย',
      exerciseName: 'ชื่อท่า',
      deleteExerciseConfirm: 'ลบท่า "{name}" ไหม?',
      repsPlaceholder: 'ครั้ง',
      repsHeader: 'ครั้ง',
      avgWeight: 'น้ำหนักเฉลี่ย (kg)', avgReps: 'จำนวนครั้งเฉลี่ย', pinnedTag: '📌 ปักหมุดแล้ว', imageUrlPlaceholder: 'URL รูปภาพ (ไม่บังคับ)', removeDayTitle: 'ลบวัน', moveUpTitle: 'เลื่อนขึ้น', moveDownTitle: 'เลื่อนลง', removeTitle: 'ลบ', uploadShort: 'อัปโหลด', imageTitle: 'รูปภาพ', deleteTitle: 'ลบ',
      timerDone: 'เสร็จ ✓',
      noPlanShort: 'ไม่พบแผน',
      activePercent: '% เสร็จ',
      openTraining: '⬆︎ เปิดการฝึก',
      noExercisesDB: 'ไม่พบท่าออกกำลังกาย',
      vorlage: '· เทมเพลต',
    }
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

  function doneKeyFor(planName, dayIndex, id) { return 'done_' + user + '_' + planName + '_' + dayIndex + '_' + dateStr() + '_' + id; }
  function doneKey(id) { return doneKeyFor(plan, day, id); }
  function swapKey(id)  { return plan + '_' + day + '_' + id; }
  function displayExercise(ex) { return ex && ex.id ? (daySwaps[swapKey(ex.id)] || ex) : ex; }

  function activateSuggestedOrPinnedPlan() {
    if (!user || (plan && plans[plan] && days && days[day])) return;
    const sug = getNextSuggestion(user);
    if (sug && plans[sug.plan]) {
      plan = sug.plan; days = plans[plan]; day = Math.min(Math.max(Number(sug.dayIndex) || 0, 0), days.length - 1);
      return;
    }
    const pinned = getPinnedPlans();
    if (pinned.length && plans[pinned[0]]) {
      plan = pinned[0]; days = plans[plan]; day = 0;
    }
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg) {
    const el = $('app-toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ── User screen ────────────────────────────────────────────────────────────
  function renderUserScreen() {
    // Update static HTML strings that live in index.html
    const ni = $('new-user-inp');
    if (ni) ni.placeholder = t('newProfile');
    const hint = document.querySelector('.start-hint');
    if (hint) hint.textContent = t('addHint');
    // Update seg tabs
    const th = $('tab-home');   if (th) th.textContent = t('navHome');
    const tt = $('tab-train');  if (tt) tt.textContent = t('navTrain');
    const tpl = $('menu-plans'); if (tpl) tpl.textContent = t('menuPlans');
    // Update user screen heading
    const h2 = document.querySelector('#screen-users h2');
    if (h2) h2.textContent = t('whoTrains');
    const logo = document.querySelector('#screen-users .logo');
    if (logo) logo.textContent = t('appName') + ' 💪';

    const users = getUsers();
    const list = $('user-list');
    list.innerHTML = '';
    if (!users.length) {
      list.innerHTML = '<div class="user-empty">' + t('noTrainingYet') + '</div>';
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
          <div class="ustats">${sess.length} ${t(sess.length===1?'sessions1':'sessionsN')}</div>
          <div class="profile-meta">
            ${last ? t('lastTraining',{plan:last.plan,label:last.label,date:last.date}) : t('noTrainingYet')}
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
    $('tab-home')?.classList.toggle('active',  next === 'home' || next === 'progress');
    $('tab-train')?.classList.toggle('active', next === 'train');
    $('menu-plans')?.classList.toggle('active', next === 'plans');

    if (next === 'train') {
      activateSuggestedOrPinnedPlan();
      renderPlanTabs();
      renderDayTabs();
    }

    // Training-only chrome
    $('daytabs').style.display    = next === 'train' ? 'flex'  : 'none';
    $('split-tabs').style.display = next === 'train' ? 'flex'  : 'none';
    $('finish-bar').style.display = next === 'train' ? 'block' : 'none';

    closeMenu();

    if      (next === 'home')     { renderDashboard(); }
    else if (next === 'train')    renderTraining();
    else if (next === 'progress') renderProgress();
    else if (next === 'plans')    renderPlanBuilder();
    else if (next === 'settings') renderSettings();
  }

  function setPlan(name, targetDay = 0) {
    saveCurrentInputs();
    if (!plans[name]) return;
    plan = name; days = plans[name];
    day = Math.min(Math.max(Number(targetDay) || 0, 0), Math.max(days.length - 1, 0));
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
      const allDone = d.ex.length > 0 && d.ex.every(ex => S.get(doneKeyFor(plan, i, ex.id), false));
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
  function todayEntry(id) {
    return getHistory(id).find(e => e.user === user && e.date === dateStr()) || null;
  }
  function inputVal(id, i, f) {
    return inputs[day]?.[id]?.[i]?.[f] || todayEntry(id)?.sets?.[i]?.[f] || '';
  }

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
              <div class="pinned-plan-meta">${p.length} ${t('addDay').replace('+ ','')} · ${p.reduce((s,d)=>s+d.ex.length,0)} ${t('addExercise')}</div></div>
              <button class="quick-btn" data-start-plan="${esc(name)}" type="button">${t('navTrain')}</button>
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
          <div class="dash-greeting">${t('greeting',{name:esc(user)})}</div>
          <div class="dash-sub">${last ? t('lastTraining',{plan:esc(last.plan),label:esc(last.label),date:esc(last.date)}) : t('noTrainingYet')}</div>
        </div>
        ${next ? `<button class="quick-btn" id="home-start" type="button">${esc(next.label)} →</button>` : ''}
      </div>
      <div class="dash-grid">
        <div class="dash-stat"><strong>${weekCount}</strong><span>${t('thisWeek')}</span></div>
        <div class="dash-stat"><strong>${log.length}</strong><span>${t('total')}</span></div>
        <div class="dash-stat"><strong>${Math.round(totalVol/1000)}t</strong><span>${t('volume')}</span></div>
      </div>
      <div id="home-train-widget" class="home-train-widget"></div>
      ${pinned.length ? `<div class="home-section-label">${t('pinnedPlans')}</div>${pinnedHtml}` : ''}
      ${lastSum ? `<div class="quick-card"><div class="quick-label">${t('lastWorkout')}</div>
        <div class="quick-title">${esc(lastSum.plan)} · ${esc(lastSum.label)}</div>
        <div class="quick-sub">${lastSum.exercises} ${t('sessions')} · ${lastSum.sets} ${t('addSet').replace('+ ','')} · ${lastSum.volume}kg</div>
      </div>` : ''}
      ${prs.length ? `<div class="quick-card"><div class="quick-label">${t('personalRecords')}</div>
        ${prs.map(pr => `<div class="pr-row"><span>🏆 ${esc(pr.exercise)}</span><strong>${pr.kg}kg×${pr.reps}</strong></div>`).join('')}
      </div>` : `<div class="quick-card"><div class="quick-label">${t('personalRecords')}</div><div class="quick-sub">${t('noDataDesc')}</div></div>`}
      <div class="quick-card"><div class="quick-label">${t('logLabel')}</div><div class="quick-sub">${sessions.length ? sessions.slice(-3).reverse().map(e=>esc(e.date)+' · '+esc(e.exercise)).join('<br>') : t('noDataDesc')}</div></div>`;

    $('home-start')?.addEventListener('click', () => {
      if (!next || !plans[next.plan]) { setScreen('plans'); return; }
      setPlan(next.plan, next.dayIndex); setScreen('train');
    });
    $('home-pin')?.addEventListener('click', () => setScreen('plans'));
    document.querySelectorAll('[data-start-plan]').forEach(b =>
      b.addEventListener('click', () => { setPlan(b.dataset.startPlan); setScreen('train'); })
    );
    renderHomeTrainWidget();
  }

  // ── Home training widget ──────────────────────────────────────────────────
  let homeWidgetOpen = false;

  function renderHomeTrainWidget() {
    const widget = $('home-train-widget');
    if (!widget) return;

    // Determine which plan/day to show (use current or suggestion)
    const sug = getNextSuggestion(user);
    const widgetPlan = (plan && days && days[day]) ? plan : (sug?.plan || null);
    const widgetDay  = (plan && days && days[day]) ? day  : (sug?.dayIndex || 0);
    const widgetDays = widgetPlan ? plans[widgetPlan] : null;
    const widgetDayObj = widgetDays?.[widgetDay];

    if (!widgetPlan || !widgetDayObj) {
      widget.innerHTML = `<div class="home-train-header" id="htw-header">
        <div>
          <div class="home-train-title">${t('navTrain')}</div>
          <div class="home-train-meta" style="color:var(--red)">${t('noPlanDesc')}</div>
        </div>
        <button class="quick-btn" id="htw-pin" type="button" style="font-size:12px">${t('pinPlan')}</button>
      </div>`;
      $('htw-pin')?.addEventListener('click', () => setScreen('plans'));
      return;
    }

    const donePct = widgetDayObj.ex.length
      ? Math.round(widgetDayObj.ex.filter(ex => {
          // Match doneKey() format exactly
          const k = 'done_'+user+'_'+widgetPlan+'_'+widgetDay+'_'+dateStr()+'_'+ex.id;
          return !!S.get(k, false);
        }).length / widgetDayObj.ex.length * 100)
      : 0;

    widget.innerHTML = `
      <div class="home-train-header" id="htw-header">
        <div style="flex:1;min-width:0">
          <div class="home-train-title">🏋️ ${esc(widgetPlan)} · ${esc(widgetDayObj.label)}</div>
          <div class="home-train-meta">${widgetDayObj.ex.length} ${t('exercises')} · ${donePct}${t('activePercent')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <div class="htw-progress-ring">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--red)" stroke-width="3"
                stroke-dasharray="${Math.round(donePct*0.88)} 88"
                stroke-linecap="round" transform="rotate(-90 18 18)"/>
              <text x="18" y="22" text-anchor="middle" fill="var(--text)" font-size="9" font-weight="900">${donePct}%</text>
            </svg>
          </div>
          <div class="home-train-chevron ${homeWidgetOpen?'open':''}">▾</div>
        </div>
      </div>
      <div class="home-train-body ${homeWidgetOpen?'open':''}">
        ${widgetDayObj.ex.map(ex => {
          const exDisp = displayExercise(ex);
          const st = styleFor(exDisp.m);
          const isDone = !!S.get('done_'+user+'_'+widgetPlan+'_'+widgetDay+'_'+dateStr()+'_'+ex.id, false);
          const hist = getHistory(ex.id).filter(e=>e.user===user).slice(-1)[0];
          return `<div class="ex-card ${isDone?'edone':''}" style="margin-bottom:8px">
            <div class="ex-row" data-htw-open="${ex.id}">
              <div class="ex-thumb">
                <img src="${esc(imageFor(exDisp.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
              </div>
              <div class="ex-info">
                <div class="ex-mtag" style="color:${st.c}">${esc(exDisp.m)}</div>
                <div class="ex-name">${esc(exDisp.n)}</div>
                ${hist ? `<div class="ex-last">${hist.date} · ${hist.sets.map(s=>`${s.kg}×${s.reps}`).join('  ')}</div>` : ''}
              </div>
              <div class="ex-r">
                ${isDone
                  ? '<div class="done-chk">✓</div>'
                  : `<div class="sets-badge">${setCounts[ex.id]||3}×</div><div class="chevron">›</div>`
                }
              </div>
            </div>
          </div>`;
        }).join('')}
        <button class="home-train-fullbtn" id="htw-fullscreen" type="button">
          ${t('openTraining')}
        </button>
      </div>`;

    $('htw-header').addEventListener('click', () => {
      homeWidgetOpen = !homeWidgetOpen;
      renderHomeTrainWidget();
    });

    document.querySelectorAll('[data-htw-open]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        // Switch to training screen and open this exercise
        if (widgetPlan !== plan || widgetDay !== day) {
          plan = widgetPlan; days = plans[plan]; day = widgetDay;
          renderPlanTabs(); renderDayTabs();
        }
        openExercise = el.dataset.htwOpen;
        setScreen('train');
      });
    });

    $('htw-fullscreen')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (widgetPlan !== plan || widgetDay !== day) {
        plan = widgetPlan; days = plans[plan]; day = widgetDay;
        renderPlanTabs(); renderDayTabs();
      }
      setScreen('train');
    });
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
            <div class="quick-label">${t('suggestion')}</div>
            <div class="quick-title">${esc(sug.plan)} · ${esc(sug.label)}</div>
            <div class="quick-sub">${last ? t('lastSession',{plan:esc(last.plan),label:esc(last.label),date:esc(last.date)}) : t('noLastSession')}</div>
          </div>
          ${isActive
            ? `<span class="quick-done">${t('suggestionActive')}</span>`
            : `<button class="quick-btn" id="open-sug" type="button">${t('openSuggestion')}</button>`
          }
        </div>
      </div>`;
    }

    html += `<div class="sec-lbl">${t('warmUp')}</div><div class="wu-row">`;
    D.WARMUP.forEach(name => {
      const done = !!warmup[name];
      html += `<div class="wu-card ${done?'done':''}" data-wu="${esc(name)}">
        <div class="wu-img"><img src="${esc(imageFor(name))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy"></div>
        <div class="wu-lbl">${done?'✓ ':''}${esc(name)}</div>
        <div class="wu-tick">✓</div>
      </div>`;
    });
    html += `</div><div class="sec-lbl">${t('gymSection',{plan:esc(plan),label:esc(d.label)})}</div>`;
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
    const isEditing = !isDone || !!editMode[original.id];
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
          value="${esc(inputVal(original.id, i, 'kg'))}" placeholder="kg"
          data-setwatch="${original.id}" data-setidx="${i}" ${!isEditing?'disabled':''}>
        <input class="ninp" type="number" inputmode="numeric" id="reps_${original.id}_${i}"
          value="${esc(inputVal(original.id, i, 'reps'))}" placeholder="${t('repsPlaceholder')}"
          data-setwatch="${original.id}" data-setidx="${i}" ${!isEditing?'disabled':''}>
        <button class="del-btn" type="button" data-del="${original.id}" data-delidx="${i}" ${!isEditing?'disabled':''}>−</button>
      </div>`;
    }

    const histHtml = hist.length ? `<div class="hist">
      <div class="hist-ttl">${t('historyLabel')}</div>
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
    const swapFilter = `<select class="swap-filter" data-swap-filter="${original.id}"><option value="">${t('swapFilterAll')}</option>${Object.keys(groups).map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}</select>`;
    const swapHtml = Object.keys(groups).map(muscle => `
      <div class="swap-group" data-swap-group="${esc(muscle)}">
      <div class="swap-group-label">${esc(muscle)}</div>
      <div class="swap-grid">${groups[muscle].map(item => {
        const swapIndex = getExerciseDB().findIndex(e => e.m === item.m && e.n === item.n);
        return `<button class="swap-card ${item.n===ex.n?'active':''}" type="button"
          data-swap-id="${original.id}" data-swap-index="${swapIndex}">
          <img src="${esc(imageFor(item.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
          <div class="swap-card-body">
            <div class="swap-muscle">${esc(item.m)}</div>
            <div class="swap-name">${esc(item.n)}</div>
            <div class="swap-select-btn">${item.n===ex.n ? t('activeExercise') : t('selectExercise')}</div>
          </div>
        </button>`;
      }).join('')}
      </div></div>`).join('');

    return `<div class="ex-card open ${isDone?'edone':''}" id="card_${original.id}" style="border-color:${st.c}55">
      <div class="ex-hero" data-open="${original.id}">
        <img src="${esc(imageFor(ex.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
        <div class="grad"></div>
        <div class="hbadge" style="background:${st.c}">${esc(ex.m)}</div>
        <div class="hbot"><div class="hname">${esc(ex.n)}</div><div class="hhint">${t('closeCard')}</div></div>
      </div>
      <div class="ex-body">
        <div class="swap-box">
          <button class="swap-toggle" type="button" data-swap-toggle="${original.id}">
            <span>${t('swapExercise')}</span><span>${swapOpen[original.id]?'−':'+'}</span>
          </button>
          <div class="swap-content ${swapOpen[original.id]?'open':''}">${swapFilter}${swapHtml}
            ${ex.swapped?`<button class="swap-reset" data-swap-reset="${original.id}">${t('resetSwap')}</button>`:''}
          </div>
        </div>
        ${histHtml}
        ${isDone&&!isEditing?`<div class="saved-edit-note">✓ ${t('savedBadge')} · ${t('editSession')}</div>`:''}<div class="inp-ttl">${t('enterToday')}</div>
        <div class="col-hd"><span></span><span>kg</span><span>${t('repsHeader')}</span><span></span></div>
        ${rows}
        <div class="rest-row">
          <button class="rest-btn" type="button" data-fill="${original.id}">${t('fillLastBtn')}</button>
          <button class="rest-btn" type="button" data-detail="${original.id}">${t('progressBtn')}</button>
        </div>
        ${isEditing?`<button class="add-s-btn" type="button" data-addset="${original.id}">${t('addSet')}</button>`:''}
        <div class="rest-row">
          <button class="rest-btn" type="button" data-rest="90">${t('rest90')}</button>
          <button class="rest-btn" type="button" data-rest="180">${t('rest180')}</button>
        </div>
        <button class="save-btn ${isDone&&!isEditing?'saved':''}" type="button"
          ${isDone&&!isEditing?`data-editex="${original.id}"`:`data-saveex="${original.id}" data-setcount="${count}"`}
          style="background:${st.c}">${isDone&&!isEditing ? t('editSession') : t('saveSession')}</button>
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
        <div class="fdm-txt">${t('trainingSavedFull',{name:esc(user)})}</div>
      </div>`; return;
    }
    if (finishConfirm) {
      inner.innerHTML = `<div class="finish-confirm">
        <div class="finish-confirm-title">${t('confirmFinish')}</div>
        <div class="finish-confirm-note">${allDone ? t('allDone') : t('stillOpen',{n:total-done})}</div>
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
          if (!S.get(doneKey(ex.id), false)) return;
          const h = getHistory(ex.id).filter(e => e.user === user && e.date === dateStr()).slice(-1)[0];
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
        setTimeout(renderHomeTrainWidget, 0);
      });
      return;
    }

    inner.innerHTML = `<button class="finish-btn ${allDone?'ready':''}" id="finish-btn" type="button">
      ${allDone ? t('finishReady') : t('finishBtn',{done,total})}
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
      // Edit saved exercise
      const editex = e.target.closest('[data-editex]');
      if (editex) { editMode[editex.dataset.editex] = true; openExercise = editex.dataset.editex; renderTraining(); return; }
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
        const id = detail.dataset.detail;
        const base = days[day]?.ex.find(e => e.id === id) || Object.values(plans).flatMap(p => p.flatMap(d => d.ex)).find(e => e.id === id);
        const ex = displayExercise(base || {id, n:id, m:'Brust'});
        progressExercise = ex.n || id;
        setScreen('progress'); return;
      }
      // Swap select
      const sw = e.target.closest('[data-swap-id]');
      if (sw) {
        const item = getExerciseDB()[Number(sw.dataset.swapIndex)];
        if (item) {
          saveCurrentInputs();
          daySwaps[swapKey(sw.dataset.swapId)] = {id:sw.dataset.swapId, m:item.m, n:item.n, swapped:true};
          openExercise = sw.dataset.swapId;
          swapOpen[sw.dataset.swapId] = true;
          showToast(t('exerciseSwapped'));
          renderTraining();
        }
        return;
      }
      // Swap toggle
      const swt = e.target.closest('[data-swap-toggle]');
      if (swt) { swapOpen[swt.dataset.swapToggle] = !swapOpen[swt.dataset.swapToggle]; renderTraining(); return; }
      // Swap reset
      const swr = e.target.closest('[data-swap-reset]');
      if (swr) { delete daySwaps[swapKey(swr.dataset.swapReset)]; openExercise = swr.dataset.swapReset; renderTraining(); return; }
    });

    document.addEventListener('change', e => {
      const filter = e.target.closest('[data-swap-filter]');
      if (!filter) return;
      const value = filter.value;
      const box = filter.closest('.swap-content');
      box?.querySelectorAll('[data-swap-group]').forEach(group => {
        group.style.display = !value || group.dataset.swapGroup === value ? '' : 'none';
      });
    });

    // Auto-start timer when both kg+reps filled
    document.addEventListener('input', e => {
      const inp = e.target.closest('.ninp[data-setwatch]');
      if (!inp || inp.disabled || !openExercise) return;
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
    const rawSets = Array.from({length:count}, (_,i) => ({
      kg:   String(inputs[day]?.[id]?.[i]?.kg   || '').trim(),
      reps: String(inputs[day]?.[id]?.[i]?.reps || '').trim(),
    }));
    const sets = rawSets
      .filter(s => (parseFloat(s.kg) || 0) > 0 || (parseFloat(s.reps) || 0) > 0)
      .map(s => ({ kg: s.kg || '0', reps: s.reps || '0' }));
    if (!sets.length) { showToast(t('noDataDesc')); return; }

    // Find actual exercise info, including swaps.
    const exInfo = getExerciseDB().find(e => e.n === (daySwaps[swapKey(id)]?.n || (days[day]?.ex.find(e=>e.id===id)?.n)));
    const entry  = {date:dateStr(), user, sets, exercise:exInfo?.n||id, muscle:exInfo?.m||'Brust', ts:Date.now()};

    // Check PR once per save: compare the best set of this entry with previous best.
    const prev = getHistory(id).filter(e=>e.user===user).flatMap(e=>e.sets)
      .reduce((best,s) => {
        const v = (parseFloat(s.kg)||0)*(parseFloat(s.reps)||0);
        return v > best.v ? {v,kg:s.kg,reps:s.reps} : best;
      }, {v:0,kg:0,reps:0});
    const sessionBest = sets.reduce((best,s) => {
      const v = (parseFloat(s.kg)||0)*(parseFloat(s.reps)||0);
      return v > best.v ? {v,kg:s.kg,reps:s.reps} : best;
    }, {v:0,kg:0,reps:0});
    if (sessionBest.v > prev.v && parseFloat(sessionBest.reps)) {
      const prs = S.get('prs_'+user,[]);
      prs.push({exercise:entry.exercise, kg:sessionBest.kg, reps:sessionBest.reps, date:dateStr(), ts:Date.now()});
      S.set('prs_'+user, prs.slice(-80));
      showToast(t('newPR') + entry.exercise + ' · ' + sessionBest.kg + 'kg×' + sessionBest.reps);
    }

    const histNow = getHistory(id);
    const sameIdx = histNow.findIndex(e => e.user === user && e.date === entry.date);
    if (sameIdx >= 0) histNow[sameIdx] = entry;
    else histNow.push(entry);
    S.set('h_' + id, histNow.slice(-80));

    const sess = S.get('sessions_'+user,[]);
    const sIdx = sess.findIndex(e => e.date===dateStr() && e.day===day && e.plan===plan && e.exercise===entry.exercise);
    const sEntry = {date:dateStr(), day, plan, exercise:entry.exercise, ts:Date.now()};
    if (sIdx >= 0) sess[sIdx] = sEntry;
    else sess.push(sEntry);
    S.set('sessions_'+user, sess.slice(-300));
    S.set(doneKey(id), true);
    delete editMode[id];
    openExercise = null;
    startTimer(90);
    renderDayTabs(); renderTraining();
    // Refresh home widget progress ring if visible
    if ($('home-train-widget')) setTimeout(renderHomeTrainWidget, 0);
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
    const rl = document.querySelector('.rest-label');
    if (rl) rl.textContent = t('restRunning');
    function tick() {
      const rem = Math.max(0, Math.ceil((window.__restEnd - Date.now()) / 1000));
      $('rest-time').textContent = rem <= 0 ? t('timerDone')
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
    if (!progressExercise) { $('prog-content').innerHTML = '<div class="empty-state"><p>'+t('noExercisesDB')+'</p></div>'; return; }

    const cur = exList.find(e=>e.n===progressExercise) || exList[0];
    const st  = styleFor(cur.m);
    const ids = Object.values(plans).flatMap(p=>p.flatMap(d=>d.ex)).filter(e=>e.n===progressExercise).map(e=>e.id);
    const hist = ids.flatMap(getHistory).filter(e=>!progressUser||e.user===progressUser);

    // Group exercises by muscle for picker
    const groups = {};
    exList.forEach(ex => { groups[ex.m]=groups[ex.m]||[]; groups[ex.m].push(ex); });

    let html = `<div class="sec-lbl">${t('selectExerciseLabel')}</div>`;
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
        <div class="stat"><div class="stat-val" style="color:${st.c}">${hist.length}</div><div class="stat-lbl">${t('sessions')}</div></div>
        <div class="stat"><div class="stat-val" style="color:${st.c}">${maxKg}kg</div><div class="stat-lbl">${t('maxKg')}</div></div>
        <div class="stat"><div class="stat-val" style="color:${st.c}">${vol}</div><div class="stat-lbl">${t('volLabel')}</div></div>
      </div>`;
    }
    html += '</div>';

    if (!hist.length) {
      $('prog-content').innerHTML = html + `<div class="empty-state"><h3>${t('noData')}</h3><p>${t('noDataDesc')}</p></div>`;
      $('prog-content').querySelectorAll('[data-pex]').forEach(b=>b.addEventListener('click',()=>{progressExercise=b.dataset.pex;renderProgress();}));
      return;
    }

    const labels   = hist.map(h=>h.date);
    const kgData   = hist.map(h=>avg(h.sets.map(s=>parseFloat(s.kg)||0)));
    const repsData = hist.map(h=>avg(h.sets.map(s=>parseFloat(s.reps)||0)));

    const canChart = !!window.Chart;
    if (canChart) {
      html += '<div class="chart-box"><div class="chart-lbl">'+t('avgWeight')+'</div><canvas id="cKg"></canvas></div>';
      html += '<div class="chart-box"><div class="chart-lbl">'+t('avgReps')+'</div><canvas id="cRp"></canvas></div>';
    } else {
      html += `<div class="chart-box chart-fallback"><div class="chart-lbl">${t('avgWeight')}</div><div class="chart-fallback-list">${labels.map((label,i)=>`<span>${esc(label)}</span><strong>${kgData[i]}kg</strong>`).join('')}</div></div>`;
      html += `<div class="chart-box chart-fallback"><div class="chart-lbl">${t('avgReps')}</div><div class="chart-fallback-list">${labels.map((label,i)=>`<span>${esc(label)}</span><strong>${repsData[i]}</strong>`).join('')}</div></div>`;
    }
    html += `<div class="sec-lbl">${t('logLabel')}</div>`;
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
    if (canChart) {
      mkChart('kg',   $('cKg'), labels, kgData,   st.c,       'kg');
      mkChart('reps', $('cRp'), labels, repsData, '#ff9f0a',  '');
    }
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
      <div class="builder-title">${t('planLibTitle')}</div>
      <div class="builder-sub">${t('planLibDesc')}</div>
      <input class="builder-input plan-search-input" id="plan-search" placeholder="${t('planSearch')}" autocomplete="off">
    </div>`;

    // Library list
    Object.keys(plans).forEach(name => {
      const p = plans[name] || [];
      const isBase = basePlanNames.includes(name);
      const isPinned = pinned.has(name);
      html += `<div class="plan-lib-card" data-plan-filter="${esc(name.toLowerCase())}">
        <div class="plan-lib-head">
          <div>
            ${isPinned ? '<span class="pinned-tag">'+t('pinnedTag')+'</span>' : ''}
            <div class="plan-lib-name">${esc(name)}</div>
            <div class="plan-lib-meta">${p.length} ${t('days')} · ${p.reduce((s,d)=>s+d.ex.length,0)} ${t('exercises')}${isBase?(' '+t('template')):''}</div>
          </div>
          <button class="pin-btn ${isPinned?'active':''}" data-pin="${esc(name)}" type="button">
            ${isPinned ? t('unpinBtn') : t('pinBtn')}
          </button>
        </div>
        <div class="builder-row" style="margin-top:10px">
          <button class="builder-btn secondary" data-dup="${esc(name)}" type="button">${t('duplicate')}</button>
          ${isBase
            ? `<button class="builder-btn secondary" data-copy="${esc(name)}" type="button">${t('copyEdit')}</button>`
            : `<button class="builder-btn secondary" data-edit="${esc(name)}" type="button">${t('editPlan')}</button>`
          }
        </div>
        ${!isBase ? `<button class="builder-btn danger" data-delplan="${esc(name)}" type="button" style="width:100%;margin-top:8px">${t('deletePlan')}</button>` : ''}
      </div>`;
    });

    // New plan section
    html += `<div class="builder-card">
      <div class="builder-title">${t('newPlanTitle')}</div>
      <input class="builder-input" id="builder-name" placeholder="${t('planNamePlaceholder')}" value="${esc(planDraft?.name||'')}">
      <div class="builder-row">
        <button class="builder-btn" id="btn-blank" type="button">${t('startBlank')}</button>
        <button class="builder-btn secondary" id="btn-addday" type="button">${t('addDay')}</button>
      </div>
      <div style="font-size:11px;color:var(--muted);margin:8px 0 4px">${t('copyTemplate')}:</div>
      <select class="builder-select" id="tpl-select">
        ${Object.keys(plans).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}
      </select>
      <button class="builder-btn secondary" id="btn-copy-tpl" type="button">${t('copyTemplate')}</button>
    </div>`;

    // Custom exercise creator
    html += `<div class="builder-card">
      <div class="builder-title">${t('customExTitle')}</div>
      <div class="builder-sub">${t('customExDesc')}</div>
      <select class="builder-select" id="cex-muscle">
        ${Object.keys(D.STYLE).map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}
      </select>
      <input class="builder-input" id="cex-name" placeholder="${t('exerciseName')}" maxlength="50">
      <input class="builder-input" id="cex-url" placeholder="${t('imageUrlPlaceholder')}">
      <div class="file-upload-row">
        <label class="file-upload-btn" for="cex-file">${t('uploadImage')}</label>
        <input id="cex-file" type="file" accept="image/*" style="display:none">
        <span id="cex-file-name" class="file-name-hint"></span>
      </div>
      <button class="builder-btn" id="cex-save" type="button" style="width:100%;margin-top:8px">${t('addExercise')}</button>
    </div>`;

    // Draft editor
    if (planDraft) {
      html += `<div class="builder-card draft-active">
        <span class="custom-pill">${t('draftActive')}</span>
        <div class="builder-title">${esc(planDraft.name || t('newPlanTitle'))}</div>
        <button class="builder-btn" id="save-draft" type="button" style="width:100%">${t('saveDraft')}</button>
      </div>`;
      html += planDraft.days.map((d, di) => `
        <div class="day-builder">
          <div class="day-builder-head">
            <input class="builder-input" data-day-label="${di}" value="${esc(d.label)}" style="margin:0;flex:1">
            <button class="builder-mini" data-rmday="${di}" type="button" title="${t('removeDayTitle')}">×</button>
          </div>
          ${d.ex.length
            ? d.ex.map((ex,ei) => `<div class="builder-ex">
                <img src="${esc(imageFor(ex.n))}" onerror="this.onerror=null;this.src=GB.FALLBACK_IMG" loading="lazy">
                <div class="builder-ex-info">
                  <div class="builder-ex-muscle" style="color:${styleFor(ex.m).c}">${esc(ex.m)}</div>
                  <div class="builder-ex-name">${esc(ex.n)}</div>
                </div>
                <button class="builder-mini" data-mvup="${di}|${ei}" title="${t('moveUpTitle')}">↑</button>
                <button class="builder-mini" data-mvdn="${di}|${ei}" title="${t('moveDownTitle')}">↓</button>
                <button class="builder-mini" data-rmex="${di}|${ei}" title="${t('removeTitle')}" style="color:var(--red)">×</button>
              </div>`).join('')
            : `<div class="builder-empty">${t('noExercises')}</div>`
          }
          ${exPicker('addex-' + di)}
          <button class="builder-btn secondary" data-addex="${di}" type="button">${t('addExerciseToDay')}</button>
        </div>`).join('');
    }

    $('plan-content').innerHTML = html;
    bindBuilderEvents();
  }

  function bindBuilderEvents() {
    const name = () => ($('builder-name')?.value || '').trim() || 'Mein Plan';
    $('plan-search')?.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll('[data-plan-filter]').forEach(card => {
        card.style.display = !q || card.dataset.planFilter.includes(q) ? '' : 'none';
      });
    });

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
      if (!confirm(t('deletePlanConfirm',{name:b.dataset.delplan}))) return;
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
              ? `<span class="profile-active-tag">${t('activeProfile')}</span><button class="builder-btn danger profile-del-btn" data-deluser="${esc(u)}" type="button">${t('deleteProfile')}</button>`
              : `<button class="builder-btn danger profile-del-btn" data-deluser="${esc(u)}" type="button">${t('deleteProfile')}</button>`
            }
          </div>`;
        }).join('')}
      </div>`;

    $('s-dark').addEventListener('click',  () => setTheme('dark'));
    $('s-light').addEventListener('click', () => setTheme('light'));
    function applyLanguage(lang){ currentLang=lang; document.documentElement.lang=lang; S.set('lang',lang); showToast(t('langSaved')); renderAccountMenuLabels(); renderUserScreen(); const rl=document.querySelector('.rest-label'); if(rl) rl.textContent=t('restRunning'); if(screen==='home')renderDashboard(); else if(screen==='train')renderTraining(); else if(screen==='progress')renderProgress(); else if(screen==='plans')renderPlanBuilder(); else if(screen==='settings')renderSettings(); }
    $('l-de').addEventListener('click', () => applyLanguage('de'));
    $('l-en').addEventListener('click', () => applyLanguage('en'));
    $('l-th').addEventListener('click', () => applyLanguage('th'));
    $('open-exdb').addEventListener('click', renderExerciseEditor);
    updateNetworkStatus();

    // Profile delete — two-click confirm
    document.querySelectorAll('[data-deluser]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.confirmed === '1') {
          const name = btn.dataset.deluser;
          const usersNow = getUsers();
          if (usersNow.length <= 1) { showToast(t('noLastProfile')); return; }
          const msg = t('deleteConfirm', {name});
          if (!confirm(msg)) return;
          const remainingUsers = usersNow.filter(u=>u!==name);
          saveUsers(remainingUsers);
          // Remove known user-bound local data for this profile.
          S.keys().forEach(key => {
            if (key === 'sessions_'+name || key === 'prs_'+name || key === 'trainingLog_'+name || key === 'pinnedPlans_'+name || key === 'theme_'+name || key.endsWith('_'+name) || key.includes('_'+name+'_')) S.remove(key);
          });
          showToast(t('profileDeleted'));
          if (window.GBCloudSync) window.GBCloudSync.push(true);
          if (name === user) { loginUser(remainingUsers[0]); setScreen('home'); return; }
          renderSettings(); renderUserScreen();
        } else {
          btn.dataset.confirmed = '1';
          btn.textContent = t('confirmDeleteShort');
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
        <input class="builder-input" id="edb-name" placeholder="${t('exerciseName')}" maxlength="50">
        <input class="builder-input" id="edb-url" placeholder="${t('imageUrlPlaceholder')}">
        <div class="file-upload-row">
          <label class="file-upload-btn" for="edb-file">📷 ${t('uploadShort')}</label>
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
            <button class="builder-mini" data-img-btn="${esc(ex.n)}" type="button" title="${t('imageTitle')}">🖼</button>
            <button class="builder-mini" data-del-ex="${esc(ex.n)}" type="button"
              title="${t('deleteTitle')}" style="color:var(--red)">×</button>
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
        if (!confirm(t('deleteExerciseConfirm',{name}))) return;
        saveCustomExercises(getCustomExercises().filter(e=>e.n!==name));
        D.EXERCISE_DB = (D.EXERCISE_DB||[]).filter(e=>e.n!==name);
        loadPlans();
        if (window.GBCloudSync) window.GBCloudSync.push(true);
        showToast(t('exerciseDeleted')); renderExerciseEditor();
      });
    });
  }


  function renderAccountMenuLabels() {
    const mn = $('menu-plans');
    const ms = $('menu-settings');
    const mp = $('menu-profile-switch');
    if (mn) mn.textContent = t('menuPlans');
    if (ms) ms.textContent = '⚙️ ' + t('menuSettings');
    if (mp) mp.textContent = '👥 ' + t('menuSwitchProfile');
    updateNetworkStatus();
  }

  // ── Account menu ───────────────────────────────────────────────────────────
  function updateNetworkStatus() {
    const online = navigator.onLine !== false;
    const text = $('menu-connection-text');
    const row = $('menu-connection');
    if (text) text.textContent = online ? t('statusOnline') : t('statusOffline');
    if (row) row.classList.toggle('offline', !online);
  }
  function toggleMenu(e) {
    if (e) e.stopPropagation();
    const m = $('account-menu');
    const b = $('sheet-backdrop');
    const willShow = !m?.classList.contains('show');
    m?.classList.toggle('show', willShow);
    b?.classList.toggle('show', willShow);
    document.body.classList.toggle('sheet-open', willShow);
    updateNetworkStatus();
  }
  function closeMenu()  {
    $('account-menu')?.classList.remove('show');
    $('sheet-backdrop')?.classList.remove('show');
    document.body.classList.remove('sheet-open');
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function migrateLegacy() {
    const users = getUsers();
    const old = S.get('pinnedPlans', null);
    if (Array.isArray(old) && users.length) {
      users.forEach(n => { if (!S.get('pinnedPlans_'+n,null)) S.set('pinnedPlans_'+n,old); });
      S.remove('pinnedPlans');
    }
  }


  function installDraggableTimer() {
    const box = $('rest-float');
    if (!box || box.dataset.draggable === '1') return;
    box.dataset.draggable = '1';
    const saved = S.get('restTimerPos', null);
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
      box.style.left = saved.x + 'px';
      box.style.top = saved.y + 'px';
      box.style.right = 'auto';
      box.style.bottom = 'auto';
      box.classList.add('floating-free');
    }
    let dragging=false, sx=0, sy=0, ox=0, oy=0;
    box.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      dragging=true; box.setPointerCapture(e.pointerId);
      const r=box.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top;
      box.classList.add('dragging');
    });
    box.addEventListener('pointermove', e => {
      if(!dragging) return;
      const w=box.offsetWidth, h=box.offsetHeight;
      const x=Math.min(Math.max(8, ox + e.clientX - sx), window.innerWidth - w - 8);
      const y=Math.min(Math.max(8, oy + e.clientY - sy), window.innerHeight - h - 8);
      box.style.left=x+'px'; box.style.top=y+'px'; box.style.right='auto'; box.style.bottom='auto'; box.classList.add('floating-free');
    });
    box.addEventListener('pointerup', e => {
      if(!dragging) return; dragging=false; box.classList.remove('dragging');
      const r=box.getBoundingClientRect(); S.set('restTimerPos',{x:Math.round(r.left), y:Math.round(r.top)});
    });
  }

  function init() {
    currentLang = S.get('lang','de');
    document.documentElement.lang=currentLang;
    renderAccountMenuLabels();
    loadPlans();
    migrateLegacy();
    applySavedTheme();
    renderUserScreen();
    bindDynamic();
    installDraggableTimer();

    const inp = $('new-user-inp'), add = $('add-user-btn');
    const upd = () => add.classList.toggle('ready', !!inp.value.trim());
    inp.addEventListener('input', upd);
    inp.addEventListener('keydown', e => { if(e.key==='Enter') addUser(); });
    add.addEventListener('click', addUser);
    add.addEventListener('touchend', e => { e.preventDefault(); addUser(); }, {passive:false});

    $('top-profile-menu').addEventListener('click', toggleMenu);
    $('menu-plans').addEventListener('click', () => { closeMenu(); setScreen('plans'); });
    $('menu-settings').addEventListener('click', () => { closeMenu(); setScreen('settings'); });
    $('menu-profile-switch').addEventListener('click', () => { closeMenu(); goUsers(); });
    $('sheet-backdrop')?.addEventListener('click', closeMenu);
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    document.addEventListener('click', e => {
      if (!e.target.closest('#account-menu') && !e.target.closest('#top-profile-menu')) closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    $('tab-home').addEventListener('click', () => setScreen('home'));
    $('tab-train').addEventListener('click', () => setScreen('train'));
    $('rest-close').addEventListener('click', () => {
      clearInterval(window.__restInt); window.__restEnd=null;
      $('rest-float').classList.remove('show');
    });
    // Update rest label on language load
    const restLabel = document.querySelector('.rest-label');
    if (restLabel) restLabel.textContent = t('restRunning');
    upd();
    updateNetworkStatus();

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
