const CACHE_NAME = 'gymbaddies-v7-3-10-polish-cache-v2';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './vendor/chart-lite.js',
  './vendor/supabase-lite.js',
  './js/storage.js',
  './js/data.js',
  './js/supabase.js',
  './js/app.js',
  './js/cloud-sync.js',
  './manifest.webmanifest',
  './icon.svg',
  './assets/exercises/ab_wheel.svg',
  './assets/exercises/abduktoren.svg',
  './assets/exercises/adduktoren.svg',
  './assets/exercises/arnold_press.svg',
  './assets/exercises/ausfallschritte.svg',
  './assets/exercises/bankdrucken.svg',
  './assets/exercises/beinbeuger.svg',
  './assets/exercises/beinbeuger_sitzend.svg',
  './assets/exercises/beinheben.svg',
  './assets/exercises/beinpresse.svg',
  './assets/exercises/beinstrecker.svg',
  './assets/exercises/bizeps_curls.svg',
  './assets/exercises/brustpresse.svg',
  './assets/exercises/bulgarian_split_squat.svg',
  './assets/exercises/burpees.svg',
  './assets/exercises/butterfly.svg',
  './assets/exercises/cable_crunch.svg',
  './assets/exercises/cable_curls.svg',
  './assets/exercises/chest_dips.svg',
  './assets/exercises/crosstrainer.svg',
  './assets/exercises/crunch.svg',
  './assets/exercises/decline_drucken.svg',
  './assets/exercises/dips.svg',
  './assets/exercises/einarmiges_rudern.svg',
  './assets/exercises/face_pulls.svg',
  './assets/exercises/fahrrad.svg',
  './assets/exercises/french_press.svg',
  './assets/exercises/frontheben.svg',
  './assets/exercises/glute_kickback.svg',
  './assets/exercises/goblet_squat.svg',
  './assets/exercises/hackenschmidt.svg',
  './assets/exercises/hammer_curls.svg',
  './assets/exercises/hanging_leg_raises.svg',
  './assets/exercises/hip_thrust.svg',
  './assets/exercises/hyperextension.svg',
  './assets/exercises/kabel_pullover.svg',
  './assets/exercises/kabelfliegende.svg',
  './assets/exercises/kabelrudern.svg',
  './assets/exercises/klimmzuge.svg',
  './assets/exercises/kniebeuge.svg',
  './assets/exercises/konzentrationscurls.svg',
  './assets/exercises/kreuzheben.svg',
  './assets/exercises/kurzhantel_flys.svg',
  './assets/exercises/latziehen_breit.svg',
  './assets/exercises/latziehen_eng.svg',
  './assets/exercises/latziehen_neutral.svg',
  './assets/exercises/laufen.svg',
  './assets/exercises/overhead_extension.svg',
  './assets/exercises/plank.svg',
  './assets/exercises/preacher_curls.svg',
  './assets/exercises/push_ups.svg',
  './assets/exercises/reverse_flys.svg',
  './assets/exercises/reverse_pec_deck.svg',
  './assets/exercises/romanian_deadlift.svg',
  './assets/exercises/rope_pushdown.svg',
  './assets/exercises/rudern_cardio.svg',
  './assets/exercises/rudern_maschine.svg',
  './assets/exercises/rudern_mit_lh.svg',
  './assets/exercises/russian_twist.svg',
  './assets/exercises/schragbank_maschine.svg',
  './assets/exercises/schragbankdrucken.svg',
  './assets/exercises/schulterdrucken.svg',
  './assets/exercises/schulterpresse_maschine.svg',
  './assets/exercises/seilspringen.svg',
  './assets/exercises/seitheben.svg',
  './assets/exercises/sit_ups.svg',
  './assets/exercises/skullcrusher.svg',
  './assets/exercises/stepper.svg',
  './assets/exercises/sz_curls.svg',
  './assets/exercises/t_bar_rudern.svg',
  './assets/exercises/trizepsdrucken.svg',
  './assets/exercises/upright_row.svg',
  './assets/exercises/wadenheben.svg'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).catch(() => undefined));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  const sameOrigin = url.origin === self.location.origin;

  // Externe Upload-Bilder, z. B. Supabase Storage, nicht im Service Worker festhalten.
  // Dadurch sehen andere Nutzer Bildwechsel schneller und ohne alten Cache.
  if (!sameOrigin) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => Response.error()));
    return;
  }

  event.respondWith(fetch(event.request).then((response) => {
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || (event.request.destination === 'document' ? caches.match('./index.html') : Response.error()))));
});
