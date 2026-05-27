# GymBaddies v7.3.10 Mobile Fix Deploy

Mobile Trainingsplan- und Fortschritts-App als statische GitHub-Pages-PWA.

Diese Deploy-ZIP enthält nur die Dateien, die für die App, GitHub Pages, Supabase-Sync und lokale Übungsbilder gebraucht werden.

## Enthaltene Dateien

```text
index.html
icon.svg
manifest.webmanifest
sw.js
README.md
css/style.css
js/app.js
js/cloud-sync.js
js/data.js
js/storage.js
js/supabase.js
vendor/chart-lite.js
vendor/supabase-lite.js
assets/exercises/*.svg
```

## Aktueller Stand

Version: v7.3.10 Mobile Fix Deploy

Wichtige Funktionen:

- mehrere Profile im kleinen gemeinsamen Nutzerkreis
- Home, Training, Fortschritt und Pläne in der unteren Navigation
- Einstellungen und Backup-Schnellexport im Profilmenü oben rechts
- manueller Rest-Timer mit Pause/Fortsetzen, ohne Auto-Start nach dem Speichern; verschieben ändert die Größe nicht
- kompaktere Trainingsansicht für Handy
- Satztypen: normaler Satz und Dropset
- Dropsets mit mehreren Gewichts-/Wiederholungsstufen
- Gewichte mit einer Nachkommastelle und Komma-/Punkt-Eingabe
- ungespeicherte Eingaben bleiben beim Wechseln zwischen Übungen erhalten und werden als offener Trainingsentwurf lokal/synchron gespeichert
- Übungen am Trainingstag zusätzlich ergänzen
- Tagesübungen per Drag-and-drop oder Pfeiltasten neu sortieren
- Training wird nur manuell abgeschlossen
- nicht erledigte Übungen werden als übersprungen markiert
- Trainingshistorie mit erledigten und übersprungenen Übungen
- getauschte Übungen behalten ihren eigenen Fortschritt
- ursprüngliche Übungen werden beim Tauschen als späterer Vorschlag vorgemerkt: zuerst am eigentlichen Tag der Ersatzübung, sonst am nächsten passenden Muskelgruppen-Tag
- Grundübungen sind geschützt: nicht löschen, nicht umbenennen, nicht ausblenden; Bildtausch bleibt möglich
- Übungsdatenbank erweitert
- lokale Übungsbild-Dateien unter `assets/exercises/`
- Backup und Restore über JSON
- gemeinsamer Supabase-Sync ohne Gruppen, Codes oder neue Tabellen
- Spotify-Steuerung bewusst nicht eingebaut

## GitHub Pages

Es gibt weiterhin keinen Build-Schritt.

Alle Dateien aus dieser ZIP direkt in den Root deines GitHub-Repositories kopieren, committen und pushen.

Richtig:

```text
dein-repo/
  index.html
  sw.js
  css/
  js/
  vendor/
  assets/
  README.md
```

Falsch:

```text
dein-repo/
  gymbaddies_v7_3_10_mobile_fix_deploy/
    index.html
```

Wichtig: Der neue Ordner `assets/` muss mit gepusht werden, sonst fehlen die lokalen Übungsbilder.

## Supabase

Die Supabase-Konfiguration liegt weiterhin hier:

```text
js/supabase.js
```

Unverändert:

```text
Tabelle: gymbaddies_sync
Sync-ID: gymbaddies-shared
Bild-Bucket: gymbaddies-images
```

Es wurden keine Sync-Gruppen, keine Codes und keine neue Tabelle eingebaut.

Der Sync speichert jetzt zusätzlich neue App-Daten wie Tagesreihenfolge, Extra-Übungen, übersprungene Übungen, Trainingshistorie und Bildänderungszeitpunkte im bestehenden gemeinsamen Payload.

## Daten und spätere Updates

GitHub Pages schreibt App-Änderungen nicht automatisch zurück in die Repository-Dateien.

Neue Übungen, Trainingsdaten, getauschte Bilder und Planänderungen liegen lokal im Browser und bei aktiviertem Sync zusätzlich in Supabase.

Für spätere Weiterentwicklung am besten immer beides sichern und mitgeben:

```text
1. aktuelle GitHub-ZIP
2. JSON-Backup aus der App
```

## Nach dem Deploy prüfen

Nach dem Push:

1. GitHub Pages kurz fertig deployen lassen.
2. App auf dem Handy komplett schließen und neu öffnen.
3. Falls noch alte Inhalte erscheinen: Website-Daten löschen oder PWA neu installieren.
4. Profil öffnen.
5. Training öffnen.
6. Eine Übung speichern.
7. Prüfen, ob Fortschritt, Historie und Supabase-Sync sauber wirken.
8. Auf einem zweiten Gerät neu laden und prüfen, ob Änderungen angekommen sind.

