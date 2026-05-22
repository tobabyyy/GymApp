(function () {
  const EXDB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
  const img = (path) => EXDB + path;
  window.GB = window.GB || {};
  GB.FALLBACK_IMG = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop';
  GB.IMAGES = {
    Butterfly: img('Butterfly/0.jpg'), Brustpresse: img('Machine_Bench_Press/0.jpg'), Schraegbankdruecken: img('Incline_Dumbbell_Press/0.jpg'),
    'Latziehen breit': img('Wide-Grip_Lat_Pulldown/0.jpg'), 'Rudern breit': img('Seated_Cable_Rows/0.jpg'), 'Rudern eng': img('Seated_Cable_Rows/1.jpg'),
    Schulterdruecken: img('Dumbbell_Shoulder_Press/0.jpg'), Seitheben: img('Side_Lateral_Raise/0.jpg'), 'Reverse Flys': img('Seated_Bent-Over_Rear_Delt_Raise/0.jpg'),
    'Preacher Curls': img('Preacher_Curl/0.jpg'), 'Bizeps Curls': img('Barbell_Curl/0.jpg'), 'Hammer Curls': img('Alternate_Hammer_Curl/0.jpg'),
    Trizepsdruecken: img('Triceps_Pushdown/0.jpg'), 'Overhead Triz. Ext.': img('Standing_Dumbbell_Triceps_Extension/0.jpg'), Crunch: img('Crunches/0.jpg'),
    Beinheben: img('Flat_Bench_Leg_Pull-In/0.jpg'), Beinbeuger: img('Lying_Leg_Curls/0.jpg'), Kniebeuge: img('Barbell_Squat/0.jpg'),
    'Hyper Extensions': img('Hyperextensions_Back_Extensions/0.jpg'), Beinstrecker: img('Leg_Extensions/0.jpg'), Wadenheben: img('Standing_Calf_Raises/0.jpg'),
    Dips: img('Bench_Dips/0.jpg'), Klimmzuege: img('Pullups/0.jpg'), 'Push-Ups': img('Pushups/0.jpg')
  };
  GB.COLORS = [{ c: '#ff6b6b', bg: '#2d1010' }, { c: '#4ecdc4', bg: '#0d2220' }, { c: '#45b7d1', bg: '#0d1e26' }, { c: '#96ceb4', bg: '#112218' }, { c: '#ffeaa7', bg: '#2a2410' }, { c: '#dda0dd', bg: '#221022' }];
  GB.STYLE = { Brust: { c: '#ff6b6b', bg: '#2d1010' }, Ruecken: { c: '#4ecdc4', bg: '#0d2220' }, Schulter: { c: '#a78bfa', bg: '#1a1030' }, Bizeps: { c: '#fbbf24', bg: '#2a1d00' }, Trizeps: { c: '#34d399', bg: '#002818' }, Bauch: { c: '#f97316', bg: '#2a1200' }, Beine: { c: '#60a5fa', bg: '#0d1a2d' }, Waden: { c: '#e879f9', bg: '#210d25' } };
  GB.WARMUP = ['Dips', 'Klimmzuege', 'Push-Ups'];
  GB.EXERCISE_DB = [
    ['Brust', 'Butterfly'], ['Brust', 'Brustpresse'], ['Brust', 'Schraegbankdruecken'], ['Brust', 'Incline Smith Press'], ['Brust', 'Cable Flys'], ['Brust', 'Pec Deck'], ['Brust', 'Push-Ups'],
    ['Ruecken', 'Latziehen breit'], ['Ruecken', 'Rudern breit'], ['Ruecken', 'Rudern eng'], ['Ruecken', 'T-Bar Row'], ['Ruecken', 'Face Pulls'], ['Ruecken', 'Straight Arm Pulldown'], ['Ruecken', 'Klimmzuege'],
    ['Schulter', 'Schulterdruecken'], ['Schulter', 'Seitheben'], ['Schulter', 'Reverse Flys'], ['Schulter', 'Arnold Press'], ['Schulter', 'Frontheben'],
    ['Bizeps', 'Preacher Curls'], ['Bizeps', 'Bizeps Curls'], ['Bizeps', 'Hammer Curls'], ['Bizeps', 'Konzentrationscurls'], ['Bizeps', 'Cable Curls'],
    ['Trizeps', 'Trizepsdruecken'], ['Trizeps', 'Overhead Triz. Ext.'], ['Trizeps', 'Skullcrusher'], ['Trizeps', 'Rope Pushdown'], ['Trizeps', 'Dips'],
    ['Bauch', 'Crunch'], ['Bauch', 'Beinheben'], ['Bauch', 'Cable Crunches'],
    ['Beine', 'Kniebeuge'], ['Beine', 'Beinbeuger'], ['Beine', 'Beinstrecker'], ['Beine', 'Hyper Extensions'], ['Beine', 'Leg Press'], ['Beine', 'Romanian Deadlift'], ['Beine', 'Bulgarian Split Squat'], ['Beine', 'Hip Thrust'], ['Beine', 'Adduktoren'], ['Beine', 'Abduktoren'], ['Waden', 'Wadenheben']
  ].map(([m, n]) => ({ m, n }));
  function n(plan) { return plan.map((day) => ({ label: day.label, ex: day.ex.map((item) => ({ id: item[0], m: item[1], n: item[2] })) })); }
  const FULL = [
    { label: 'Tag 1', ex: [['a1', 'Brust', 'Butterfly'], ['a2', 'Ruecken', 'Latziehen breit'], ['a3', 'Schulter', 'Schulterdruecken'], ['a4', 'Bizeps', 'Preacher Curls'], ['a5', 'Trizeps', 'Trizepsdruecken'], ['a6', 'Bauch', 'Crunch'], ['a7', 'Beine', 'Beinbeuger'], ['a8', 'Waden', 'Wadenheben']] },
    { label: 'Tag 2', ex: [['b1', 'Brust', 'Brustpresse'], ['b2', 'Ruecken', 'Rudern breit'], ['b3', 'Schulter', 'Seitheben'], ['b4', 'Bizeps', 'Bizeps Curls'], ['b5', 'Trizeps', 'Overhead Triz. Ext.'], ['b6', 'Bauch', 'Beinheben'], ['b7', 'Beine', 'Kniebeuge'], ['b8', 'Waden', 'Wadenheben']] },
    { label: 'Tag 3', ex: [['c1', 'Brust', 'Schraegbankdruecken'], ['c2', 'Ruecken', 'Rudern eng'], ['c3', 'Schulter', 'Reverse Flys'], ['c4', 'Bizeps', 'Hammer Curls'], ['c5', 'Trizeps', 'Trizepsdruecken'], ['c6', 'Bauch', 'Crunch'], ['c7', 'Beine', 'Hyper Extensions'], ['c8', 'Waden', 'Wadenheben']] },
    { label: 'Tag 4', ex: [['d1', 'Brust', 'Butterfly'], ['d2', 'Ruecken', 'Latziehen breit'], ['d3', 'Schulter', 'Schulterdruecken'], ['d4', 'Bizeps', 'Preacher Curls'], ['d5', 'Trizeps', 'Overhead Triz. Ext.'], ['d6', 'Bauch', 'Beinheben'], ['d7', 'Beine', 'Beinstrecker'], ['d8', 'Waden', 'Wadenheben']] }
  ];
  const UL = [
    { label: 'Upper 1', ex: [['ul1', 'Brust', 'Brustpresse'], ['ul2', 'Ruecken', 'Latziehen breit'], ['ul3', 'Schulter', 'Schulterdruecken'], ['ul4', 'Brust', 'Butterfly'], ['ul5', 'Bizeps', 'Bizeps Curls'], ['ul6', 'Trizeps', 'Trizepsdruecken'], ['ul7', 'Bauch', 'Crunch']] },
    { label: 'Lower 1', ex: [['ul8', 'Beine', 'Kniebeuge'], ['ul9', 'Beine', 'Beinbeuger'], ['ul10', 'Beine', 'Beinstrecker'], ['ul11', 'Beine', 'Hyper Extensions'], ['ul12', 'Waden', 'Wadenheben'], ['ul13', 'Bauch', 'Beinheben']] },
    { label: 'Upper 2', ex: [['ul14', 'Brust', 'Schraegbankdruecken'], ['ul15', 'Ruecken', 'Rudern breit'], ['ul16', 'Ruecken', 'Rudern eng'], ['ul17', 'Schulter', 'Seitheben'], ['ul18', 'Schulter', 'Reverse Flys'], ['ul19', 'Bizeps', 'Preacher Curls'], ['ul20', 'Trizeps', 'Overhead Triz. Ext.']] },
    { label: 'Lower 2', ex: [['ul21', 'Beine', 'Kniebeuge'], ['ul22', 'Beine', 'Beinbeuger'], ['ul23', 'Beine', 'Beinstrecker'], ['ul24', 'Waden', 'Wadenheben'], ['ul25', 'Bauch', 'Crunch']] }
  ];
  const PPL = [
    { label: 'Push', ex: [['p1', 'Brust', 'Brustpresse'], ['p2', 'Brust', 'Schraegbankdruecken'], ['p3', 'Brust', 'Butterfly'], ['p4', 'Schulter', 'Schulterdruecken'], ['p5', 'Schulter', 'Seitheben'], ['p6', 'Trizeps', 'Trizepsdruecken'], ['p7', 'Trizeps', 'Overhead Triz. Ext.']] },
    { label: 'Pull', ex: [['p8', 'Ruecken', 'Latziehen breit'], ['p9', 'Ruecken', 'Rudern breit'], ['p10', 'Ruecken', 'Rudern eng'], ['p11', 'Schulter', 'Reverse Flys'], ['p12', 'Bizeps', 'Preacher Curls'], ['p13', 'Bizeps', 'Bizeps Curls'], ['p14', 'Bizeps', 'Hammer Curls']] },
    { label: 'Legs', ex: [['p15', 'Beine', 'Kniebeuge'], ['p16', 'Beine', 'Beinbeuger'], ['p17', 'Beine', 'Beinstrecker'], ['p18', 'Beine', 'Hyper Extensions'], ['p19', 'Waden', 'Wadenheben'], ['p20', 'Bauch', 'Crunch'], ['p21', 'Bauch', 'Beinheben']] }
  ];

  function autoImage(name, muscle) {
    const colors = {
      Brust: ['#ff6b6b', '#2d1010'],
      Ruecken: ['#4ecdc4', '#0d2220'],
      Schulter: ['#a78bfa', '#1a1030'],
      Bizeps: ['#fbbf24', '#2a1d00'],
      Trizeps: ['#34d399', '#002818'],
      Bauch: ['#f97316', '#2a1200'],
      Beine: ['#60a5fa', '#0d1a2d'],
      Waden: ['#e879f9', '#210d25']
    };
    const pair = colors[muscle] || ['#ff3b30', '#151515'];
    const safeName = String(name).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const safeMuscle = String(muscle).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${pair[1]}" offset="0"/><stop stop-color="#101010" offset="1"/></linearGradient></defs>
      <rect width="900" height="560" fill="url(#g)"/>
      <rect x="44" y="44" width="812" height="472" rx="42" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.16)"/>
      <circle cx="450" cy="188" r="54" fill="none" stroke="${pair[0]}" stroke-width="18"/>
      <path d="M314 305 C360 248 540 248 586 305" fill="none" stroke="${pair[0]}" stroke-width="22" stroke-linecap="round"/>
      <path d="M365 316 L322 408 M535 316 L578 408 M414 310 L392 432 M486 310 L508 432" stroke="#f8f8f8" stroke-width="20" stroke-linecap="round"/>
      <path d="M275 422 H625" stroke="${pair[0]}" stroke-width="14" stroke-linecap="round"/>
      <text x="450" y="496" text-anchor="middle" fill="#fff" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="900">${safeName}</text>
      <text x="450" y="530" text-anchor="middle" fill="${pair[0]}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" letter-spacing="5">${safeMuscle.toUpperCase()}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  const EXTRA_EXERCISES = [
    ['Brust', 'Bankdruecken'], ['Brust', 'Kurzhantel Bankdruecken'], ['Brust', 'Fliegende Kurzhantel'], ['Brust', 'Cable Flys hoch'], ['Brust', 'Cable Flys tief'],
    ['Ruecken', 'Klimmzug eng'], ['Ruecken', 'Einarmiges Rudern'], ['Ruecken', 'Chest Supported Row'], ['Ruecken', 'Latzug eng'], ['Ruecken', 'Rack Pulls'],
    ['Schulter', 'Military Press'], ['Schulter', 'Cable Lateral Raise'], ['Schulter', 'Upright Row'], ['Schulter', 'Rear Delt Machine'],
    ['Bizeps', 'SZ Curls'], ['Bizeps', 'Incline Curls'], ['Bizeps', 'Reverse Curls'],
    ['Trizeps', 'French Press'], ['Trizeps', 'Dips Maschine'], ['Trizeps', 'Einarmiges Trizepsdruecken'],
    ['Bauch', 'Plank'], ['Bauch', 'Russian Twists'], ['Bauch', 'Hanging Leg Raises'], ['Bauch', 'Ab Wheel'],
    ['Beine', 'Ausfallschritte'], ['Beine', 'Hack Squat'], ['Beine', 'Sumo Deadlift'], ['Beine', 'Glute Bridge'], ['Beine', 'Good Mornings'], ['Beine', 'Step Ups'],
    ['Waden', 'Sitzendes Wadenheben'], ['Waden', 'Donkey Calf Raises']
  ];
  EXTRA_EXERCISES.forEach(([m, n]) => GB.EXERCISE_DB.push({ m, n }));
  const seenExercises = new Set();
  GB.EXERCISE_DB = GB.EXERCISE_DB
    .filter((item) => {
      const key = item.m + '|' + item.n;
      if (seenExercises.has(key)) return false;
      seenExercises.add(key);
      return true;
    })
    .sort((a, b) => (a.m + a.n).localeCompare(b.m + b.n, 'de'));
  GB.EXERCISE_DB.forEach((item) => {
    if (!GB.IMAGES[item.n]) GB.IMAGES[item.n] = autoImage(item.n, item.m);
  });

  GB.BASE_PLANS = { Ganzkoerper: n(FULL), 'Upper/Lower': n(UL), 'Push/Pull/Legs': n(PPL) };
}());
