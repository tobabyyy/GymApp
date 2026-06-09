const CACHE_NAME = 'gymbaddies-v7-3-16-stable-design-real-art-cache-v1';
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
  './assets/exercises/ab_wheel.webp',
  './assets/exercises/abduktoren.webp',
  './assets/exercises/adduktoren.webp',
  './assets/exercises/arnold_press.webp',
  './assets/exercises/ausfallschritte.webp',
  './assets/exercises/bankdrucken.webp',
  './assets/exercises/beinbeuger.webp',
  './assets/exercises/beinbeuger_sitzend.webp',
  './assets/exercises/beinheben.webp',
  './assets/exercises/beinpresse.webp',
  './assets/exercises/beinstrecker.webp',
  './assets/exercises/bizeps_curls.webp',
  './assets/exercises/brustpresse.webp',
  './assets/exercises/bulgarian_split_squat.webp',
  './assets/exercises/burpees.webp',
  './assets/exercises/butterfly.webp',
  './assets/exercises/cable_crunch.webp',
  './assets/exercises/cable_curls.webp',
  './assets/exercises/chest_dips.webp',
  './assets/exercises/crosstrainer.webp',
  './assets/exercises/crunch.webp',
  './assets/exercises/decline_drucken.webp',
  './assets/exercises/dips.webp',
  './assets/exercises/einarmiges_rudern.webp',
  './assets/exercises/face_pulls.webp',
  './assets/exercises/fahrrad.webp',
  './assets/exercises/french_press.webp',
  './assets/exercises/frontheben.webp',
  './assets/exercises/glute_kickback.webp',
  './assets/exercises/goblet_squat.webp',
  './assets/exercises/hackenschmidt.webp',
  './assets/exercises/hammer_curls.webp',
  './assets/exercises/hanging_leg_raises.webp',
  './assets/exercises/hip_thrust.webp',
  './assets/exercises/hyperextension.webp',
  './assets/exercises/kabel_pullover.webp',
  './assets/exercises/kabelfliegende.webp',
  './assets/exercises/kabelrudern.webp',
  './assets/exercises/klimmzuge.webp',
  './assets/exercises/kniebeuge.webp',
  './assets/exercises/konzentrationscurls.webp',
  './assets/exercises/kreuzheben.webp',
  './assets/exercises/kurzhantel_flys.webp',
  './assets/exercises/latziehen_breit.webp',
  './assets/exercises/latziehen_eng.webp',
  './assets/exercises/latziehen_neutral.webp',
  './assets/exercises/laufen.webp',
  './assets/exercises/overhead_extension.webp',
  './assets/exercises/plank.webp',
  './assets/exercises/preacher_curls.webp',
  './assets/exercises/push_ups.webp',
  './assets/exercises/reverse_flys.webp',
  './assets/exercises/reverse_pec_deck.webp',
  './assets/exercises/romanian_deadlift.webp',
  './assets/exercises/rope_pushdown.webp',
  './assets/exercises/rudern_cardio.webp',
  './assets/exercises/rudern_maschine.webp',
  './assets/exercises/rudern_mit_lh.webp',
  './assets/exercises/russian_twist.webp',
  './assets/exercises/schragbank_maschine.webp',
  './assets/exercises/schragbankdrucken.webp',
  './assets/exercises/schulterdrucken.webp',
  './assets/exercises/schulterpresse_maschine.webp',
  './assets/exercises/seilspringen.webp',
  './assets/exercises/seitheben.webp',
  './assets/exercises/sit_ups.webp',
  './assets/exercises/skullcrusher.webp',
  './assets/exercises/stepper.webp',
  './assets/exercises/sz_curls.webp',
  './assets/exercises/t_bar_rudern.webp',
  './assets/exercises/trizepsdrucken.webp',
  './assets/exercises/upright_row.webp',
  './assets/exercises/wadenheben.webp'
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
