# GymBaddies v7.3.16

Clean-Deploy-Version fuer GitHub Pages.

## Stand

- Design wieder auf der stabilen Optik aus v7.3.11/v7.3.12.
- Funktionen und Datenmodell aus den neueren Versionen bleiben erhalten.
- Lokale realistischere Uebungsgrafiken liegen unter `assets/exercises/`.
- Standarduebungen laden ihre Bilder lokal als `.webp`.
- Keine externen Bild-URLs fuer Standarduebungen.
- Supabase bleibt unveraendert: eine gemeinsame Sync-ID, keine Gruppen, keine neuen Tabellen.

## Upload zu GitHub Pages

1. ZIP entpacken.
2. Inhalt der ZIP direkt in das Repository kopieren, nicht den Ordner selbst.
3. Vorhandene Dateien ersetzen.
4. Den Ordner `assets/` vollstaendig mit committen.
5. Committen und pushen.
6. App/PWA danach einmal komplett schliessen und neu oeffnen.

## Wichtige Dateien

```text
index.html
sw.js
manifest.webmanifest
css/style.css
js/app.js
js/data.js
js/storage.js
js/cloud-sync.js
js/supabase.js
vendor/
assets/exercises/
```

## Supabase

Unveraendert:

```text
Tabelle: gymbaddies_sync
Sync-ID: gymbaddies-shared
Konfiguration: js/supabase.js
Bucket: gymbaddies-images
```

Beim Push zu GitHub wird Supabase selbst nicht veraendert.
