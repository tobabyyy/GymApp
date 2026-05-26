(function () {
  'use strict';
  window.GB = window.GB || {};

  // ── Image base ────────────────────────────────────────────────────────────
  const EX = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  GB.FALLBACK_IMG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop';

  // ── Auto-generate placeholder SVG ────────────────────────────────────────
  GB.autoImage = function (name, muscle) {
    const COLS = {
      Brust: ['#ff6b6b','#2d1010'], Rücken: ['#4ecdc4','#0d2220'],
      Schultern: ['#a78bfa','#1a1030'], Arme: ['#fbbf24','#2a1d00'],
      Bauch: ['#f97316','#2a1200'], Beine: ['#60a5fa','#0d1a2d'],
      Cardio: ['#34d399','#002818'],
    };
    const [c, bg] = COLS[muscle] || ['#ff3b30','#151515'];
    const sn = String(name).replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
    const sm = String(muscle).replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${bg}" offset="0"/><stop stop-color="#101010" offset="1"/></linearGradient></defs><rect width="900" height="560" fill="url(#g)"/><rect x="44" y="44" width="812" height="472" rx="42" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.14)"/><circle cx="450" cy="188" r="54" fill="none" stroke="${c}" stroke-width="18"/><path d="M314 305 C360 248 540 248 586 305" fill="none" stroke="${c}" stroke-width="22" stroke-linecap="round"/><path d="M365 316 L322 408 M535 316 L578 408 M414 310 L392 432 M486 310 L508 432" stroke="#f8f8f8" stroke-width="20" stroke-linecap="round"/><text x="450" y="490" text-anchor="middle" fill="#fff" font-family="Arial" font-size="40" font-weight="900">${sn}</text><text x="450" y="526" text-anchor="middle" fill="${c}" font-family="Arial" font-size="16" font-weight="900" letter-spacing="5">${sm.toUpperCase()}</text></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  // ── Colour palette per muscle ─────────────────────────────────────────────
  GB.STYLE = {
    Brust:    { c: '#ff6b6b', bg: '#2d1010' },
    Rücken:   { c: '#4ecdc4', bg: '#0d2220' },
    Schultern:{ c: '#a78bfa', bg: '#1a1030' },
    Arme:     { c: '#fbbf24', bg: '#2a1d00' },
    Bauch:    { c: '#f97316', bg: '#2a1200' },
    Beine:    { c: '#60a5fa', bg: '#0d1a2d' },
    Cardio:   { c: '#34d399', bg: '#002818' },
  };
  GB.COLORS = [
    { c: '#ff6b6b', bg: '#2d1010' }, { c: '#4ecdc4', bg: '#0d2220' },
    { c: '#45b7d1', bg: '#0d1e26' }, { c: '#96ceb4', bg: '#112218' },
    { c: '#ffeaa7', bg: '#2a2410' }, { c: '#dda0dd', bg: '#221022' },
  ];

  // ── Warm-up exercises ─────────────────────────────────────────────────────
  GB.WARMUP = ['Dips', 'Klimmzüge', 'Push-Ups'];

  // ── Clean exercise database — no duplicates, unified names ─────────────────
  // Images use free-exercise-db paths; fallback is autoImage()
  const IMG = (p) => EX + p;
  GB.IMAGES = {
    // Brust
    'Butterfly':            IMG('Butterfly/0.jpg'),
    'Brustpresse':          IMG('Machine_Bench_Press/0.jpg'),
    'Schrägbankdrücken':    IMG('Incline_Dumbbell_Press/0.jpg'),
    'Bankdrücken':          IMG('Barbell_Bench_Press_-_Medium_Grip/0.jpg'),
    'Kabelfliegende':       IMG('Cable_Crossovers/0.jpg'),
    'Kurzhantel Flys':      IMG('Dumbbell_Flyes/0.jpg'),
    'Push-Ups':             IMG('Pushups/0.jpg'),
    'Decline Drücken':      IMG('Decline_Barbell_Bench_Press/0.jpg'),
    // Rücken
    'Latziehen breit':      IMG('Wide-Grip_Lat_Pulldown/0.jpg'),
    'Latziehen eng':        IMG('Close-Grip_Front_Lat_Pulldown/0.jpg'),
    'Rudern mit LH':        IMG('Barbell_Bent_Over_Row/0.jpg'),
    'Kabelrudern':          IMG('Seated_Cable_Rows/0.jpg'),
    'Klimmzüge':            IMG('Pullups/0.jpg'),
    'T-Bar Rudern':         IMG('T-Bar_Row_with_Handle/0.jpg'),
    'Face Pulls':           IMG('Face_Pull/0.jpg'),
    'Kreuzheben':           IMG('Barbell_Deadlift/0.jpg'),
    'Hyperextension':       IMG('Hyperextensions_Back_Extensions/0.jpg'),
    // Schultern
    'Schulterdrücken':      IMG('Dumbbell_Shoulder_Press/0.jpg'),
    'Seitheben':            IMG('Side_Lateral_Raise/0.jpg'),
    'Frontheben':           IMG('Dumbbell_Front_Raise/0.jpg'),
    'Reverse Flys':         IMG('Seated_Bent-Over_Rear_Delt_Raise/0.jpg'),
    'Arnold Press':         IMG('Arnold_Dumbbell_Press/0.jpg'),
    'Upright Row':          IMG('Barbell_Upright_Row/0.jpg'),
    // Arme (Bizeps + Trizeps unified)
    'Bizeps Curls':         IMG('Barbell_Curl/0.jpg'),
    'Preacher Curls':       IMG('Preacher_Curl/0.jpg'),
    'Hammer Curls':         IMG('Alternate_Hammer_Curl/0.jpg'),
    'Konzentrationscurls':  IMG('Concentration_Curls/0.jpg'),
    'Cable Curls':          IMG('Cable_Curl/0.jpg'),
    'Trizepsdrücken':       IMG('Triceps_Pushdown/0.jpg'),
    'Overhead Extension':   IMG('Standing_Dumbbell_Triceps_Extension/0.jpg'),
    'Skullcrusher':         IMG('Barbell_JM_Bench_Press/0.jpg'),
    'Dips':                 IMG('Bench_Dips/0.jpg'),
    // Bauch
    'Crunch':               IMG('Crunches/0.jpg'),
    'Beinheben':            IMG('Flat_Bench_Leg_Pull-In/0.jpg'),
    'Cable Crunch':         IMG('Cable_Crunch/0.jpg'),
    'Russian Twist':        IMG('Russian_Twist/0.jpg'),
    'Plank':                IMG('Pushups/0.jpg'),  // closest available
    // Beine
    'Kniebeuge':            IMG('Barbell_Squat/0.jpg'),
    'Beinpresse':           IMG('Leg_Press/0.jpg'),
    'Beinbeuger':           IMG('Lying_Leg_Curls/0.jpg'),
    'Beinstrecker':         IMG('Leg_Extensions/0.jpg'),
    'Romanian Deadlift':    IMG('Romanian_Deadlift/0.jpg'),
    'Bulgarian Split Squat':IMG('Barbell_Bulgarian_Split_Squat/0.jpg'),
    'Hip Thrust':           IMG('Barbell_Hip_Thrust/0.jpg'),
    'Ausfallschritte':      IMG('Dumbbell_Lunges/0.jpg'),
    'Wadenheben':           IMG('Standing_Calf_Raises/0.jpg'),
    'Hyperextension':       IMG('Hyperextensions_Back_Extensions/0.jpg'),
    // Cardio
    'Laufen':               GB.FALLBACK_IMG,
    'Fahrrad':              GB.FALLBACK_IMG,
    'Rudern (Cardio)':      GB.FALLBACK_IMG,
    'Seilspringen':         GB.FALLBACK_IMG,
    'Burpees':              GB.FALLBACK_IMG,
  };

  // Deduplicated, sorted exercise list
  GB.EXERCISE_DB = [
    // Brust
    { m: 'Brust', n: 'Butterfly' },
    { m: 'Brust', n: 'Brustpresse' },
    { m: 'Brust', n: 'Schrägbankdrücken' },
    { m: 'Brust', n: 'Bankdrücken' },
    { m: 'Brust', n: 'Decline Drücken' },
    { m: 'Brust', n: 'Kabelfliegende' },
    { m: 'Brust', n: 'Kurzhantel Flys' },
    { m: 'Brust', n: 'Push-Ups' },
    // Rücken
    { m: 'Rücken', n: 'Latziehen breit' },
    { m: 'Rücken', n: 'Latziehen eng' },
    { m: 'Rücken', n: 'Rudern mit LH' },
    { m: 'Rücken', n: 'Kabelrudern' },
    { m: 'Rücken', n: 'Klimmzüge' },
    { m: 'Rücken', n: 'T-Bar Rudern' },
    { m: 'Rücken', n: 'Face Pulls' },
    { m: 'Rücken', n: 'Kreuzheben' },
    { m: 'Rücken', n: 'Hyperextension' },
    // Schultern
    { m: 'Schultern', n: 'Schulterdrücken' },
    { m: 'Schultern', n: 'Seitheben' },
    { m: 'Schultern', n: 'Frontheben' },
    { m: 'Schultern', n: 'Reverse Flys' },
    { m: 'Schultern', n: 'Arnold Press' },
    { m: 'Schultern', n: 'Upright Row' },
    // Arme
    { m: 'Arme', n: 'Bizeps Curls' },
    { m: 'Arme', n: 'Preacher Curls' },
    { m: 'Arme', n: 'Hammer Curls' },
    { m: 'Arme', n: 'Konzentrationscurls' },
    { m: 'Arme', n: 'Cable Curls' },
    { m: 'Arme', n: 'Trizepsdrücken' },
    { m: 'Arme', n: 'Overhead Extension' },
    { m: 'Arme', n: 'Skullcrusher' },
    { m: 'Arme', n: 'Dips' },
    // Bauch
    { m: 'Bauch', n: 'Crunch' },
    { m: 'Bauch', n: 'Beinheben' },
    { m: 'Bauch', n: 'Cable Crunch' },
    { m: 'Bauch', n: 'Russian Twist' },
    { m: 'Bauch', n: 'Plank' },
    // Beine
    { m: 'Beine', n: 'Kniebeuge' },
    { m: 'Beine', n: 'Beinpresse' },
    { m: 'Beine', n: 'Beinbeuger' },
    { m: 'Beine', n: 'Beinstrecker' },
    { m: 'Beine', n: 'Romanian Deadlift' },
    { m: 'Beine', n: 'Bulgarian Split Squat' },
    { m: 'Beine', n: 'Hip Thrust' },
    { m: 'Beine', n: 'Ausfallschritte' },
    { m: 'Beine', n: 'Wadenheben' },
    // Cardio
    { m: 'Cardio', n: 'Laufen' },
    { m: 'Cardio', n: 'Fahrrad' },
    { m: 'Cardio', n: 'Rudern (Cardio)' },
    { m: 'Cardio', n: 'Seilspringen' },
    { m: 'Cardio', n: 'Burpees' },
  ];

  // Fill missing images with autoImage
  GB.EXERCISE_DB.forEach(ex => {
    if (!GB.IMAGES[ex.n]) GB.IMAGES[ex.n] = GB.autoImage(ex.n, ex.m);
  });
  // Warmup images
  GB.IMAGES['Klimmzüge'] = IMG('Pullups/0.jpg');

  // ── Base plans (no default selected — user must pin) ──────────────────────
  function mkPlan(days) {
    return days.map(d => ({ label: d.label, ex: d.ex.map(e => ({ id: e[0], m: e[1], n: e[2] })) }));
  }

  GB.BASE_PLANS = {
    'Ganzkörper': mkPlan([
      { label: 'Tag 1', ex: [['a1','Brust','Butterfly'],['a2','Rücken','Latziehen breit'],['a3','Schultern','Schulterdrücken'],['a4','Arme','Preacher Curls'],['a5','Arme','Trizepsdrücken'],['a6','Bauch','Crunch'],['a7','Beine','Beinbeuger'],['a8','Beine','Wadenheben']] },
      { label: 'Tag 2', ex: [['b1','Brust','Brustpresse'],['b2','Rücken','Rudern mit LH'],['b3','Schultern','Seitheben'],['b4','Arme','Bizeps Curls'],['b5','Arme','Overhead Extension'],['b6','Bauch','Beinheben'],['b7','Beine','Kniebeuge'],['b8','Beine','Wadenheben']] },
      { label: 'Tag 3', ex: [['c1','Brust','Schrägbankdrücken'],['c2','Rücken','Kabelrudern'],['c3','Schultern','Reverse Flys'],['c4','Arme','Hammer Curls'],['c5','Arme','Trizepsdrücken'],['c6','Bauch','Crunch'],['c7','Beine','Hyperextension'],['c8','Beine','Wadenheben']] },
      { label: 'Tag 4', ex: [['d1','Brust','Butterfly'],['d2','Rücken','Latziehen breit'],['d3','Schultern','Schulterdrücken'],['d4','Arme','Preacher Curls'],['d5','Arme','Overhead Extension'],['d6','Bauch','Beinheben'],['d7','Beine','Beinstrecker'],['d8','Beine','Wadenheben']] },
    ]),
    'Upper/Lower': mkPlan([
      { label: 'Upper A', ex: [['ul1','Brust','Brustpresse'],['ul2','Rücken','Latziehen breit'],['ul3','Schultern','Schulterdrücken'],['ul4','Brust','Butterfly'],['ul5','Arme','Bizeps Curls'],['ul6','Arme','Trizepsdrücken'],['ul7','Bauch','Crunch']] },
      { label: 'Lower A', ex: [['ul8','Beine','Kniebeuge'],['ul9','Beine','Beinbeuger'],['ul10','Beine','Beinstrecker'],['ul11','Beine','Hyperextension'],['ul12','Beine','Wadenheben'],['ul13','Bauch','Beinheben']] },
      { label: 'Upper B', ex: [['ul14','Brust','Schrägbankdrücken'],['ul15','Rücken','Rudern mit LH'],['ul16','Rücken','Kabelrudern'],['ul17','Schultern','Seitheben'],['ul18','Schultern','Reverse Flys'],['ul19','Arme','Preacher Curls'],['ul20','Arme','Overhead Extension']] },
      { label: 'Lower B', ex: [['ul21','Beine','Beinpresse'],['ul22','Beine','Romanian Deadlift'],['ul23','Beine','Beinbeuger'],['ul24','Beine','Wadenheben'],['ul25','Bauch','Crunch']] },
    ]),
    'Push/Pull/Legs': mkPlan([
      { label: 'Push', ex: [['p1','Brust','Brustpresse'],['p2','Brust','Schrägbankdrücken'],['p3','Brust','Butterfly'],['p4','Schultern','Schulterdrücken'],['p5','Schultern','Seitheben'],['p6','Arme','Trizepsdrücken'],['p7','Arme','Overhead Extension']] },
      { label: 'Pull', ex: [['p8','Rücken','Latziehen breit'],['p9','Rücken','Rudern mit LH'],['p10','Rücken','Kabelrudern'],['p11','Schultern','Reverse Flys'],['p12','Arme','Preacher Curls'],['p13','Arme','Bizeps Curls'],['p14','Arme','Hammer Curls']] },
      { label: 'Legs', ex: [['p15','Beine','Kniebeuge'],['p16','Beine','Beinbeuger'],['p17','Beine','Beinstrecker'],['p18','Beine','Hyperextension'],['p19','Beine','Wadenheben'],['p20','Bauch','Crunch'],['p21','Bauch','Beinheben']] },
    ]),
  };
}());
