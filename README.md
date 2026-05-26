# GymBaddies v7.3.8 Clean Deploy

Mobile Trainingsplan- und Fortschritts-App als statische PWA.

Diese ZIP ist die aufgeräumte Deploy-Version. Sie enthält nur die Dateien, die für GitHub Pages und die App selbst wichtig sind.

## Was drin ist

- `index.html` als Einstiegspunkt
- `css/style.css` für das komplette Styling
- `js/` mit App-Logik, Trainingsdaten, lokaler Speicherung, Supabase-Konfiguration und Sync
- `vendor/` mit lokalen Fallback-Dateien für Charts und Supabase-Kompatibilität
- `manifest.webmanifest`, `sw.js` und `icon.svg` für PWA, Homescreen und Offline-Cache
- diese `README.md`

Nicht mehr enthalten sind alte Changelogs, Testberichte, Testskripte und separate Hinweisdateien.

## Aktueller Stand

Version: v7.3.8 Full Mobile Polish / Clean Deploy

Enthaltene Hauptfunktionen:

- Profile für mehrere Nutzer
- mobile Bottom-Navigation
- Onboarding und Schnellstart
- Trainingslogging mit Sätzen, Satztypen, RPE, Notizen, PRs und Verlauf
- Planbibliothek und Plan-Builder
- Supersets im Plan-Builder
- Deload-Modus pro Profil
- Steigerungsvorschläge pro Übung
- Fortschrittsansicht mit Wochenvolumen, Frequenz, Muskel-Balance und Planentwicklung
- Übungsdatenbank mit Suche, Kategorien, Favoriten, Ausblenden und Wiederherstellen
- Backup und Restore über JSON in den Einstellungen
- In-App Selbsttest in den Einstellungen
- lokaler Bildfallback für Übungen
- gemeinsamer Supabase Auto-Sync für den kleinen Nutzerkreis

## GitHub Pages

Die App braucht keinen Build-Schritt.

Einfach alle Dateien aus dieser ZIP direkt in den Root deines GitHub-Repositories kopieren, committen und pushen.

Wichtig: Die Dateien dürfen nicht in einem zusätzlichen Unterordner landen. `index.html` muss direkt im Repository-Root liegen, wenn GitHub Pages aus dem Root deployed.

## Supabase

Die Supabase-Konfiguration liegt weiterhin in:

```text
js/supabase.js
```

Das Grundprinzip bleibt unverändert:

- eine gemeinsame Sync-Instanz für den kleinen Kreis
- keine Sync-Gruppen
- keine neuen Codes
- keine neue Tabelle
- bestehende Tabelle: `gymbaddies_sync`
- bestehende Sync-ID: `gymbaddies-shared`
- Bild-Bucket: `gymbaddies-images`

Wenn deine bisherige Version mit Supabase funktioniert hat, musst du für diese Version normalerweise nichts Neues in Supabase anlegen.

## Nach dem Deploy prüfen

Nach dem Push und GitHub-Pages-Deploy:

1. App im Browser öffnen.
2. Auf dem Handy einmal hart neu laden oder die installierte PWA schließen und neu öffnen.
3. In der App unter Einstellungen den Selbsttest starten.
4. Ein Profil öffnen.
5. Einen Plan anheften.
6. Ein Training starten, eine Übung speichern und prüfen, ob Fortschritt und Sync-Status sauber aussehen.

## Backup-Empfehlung

Vor größeren Updates in der App unter Einstellungen ein JSON-Backup exportieren. So kannst du lokale Daten jederzeit wiederherstellen.
