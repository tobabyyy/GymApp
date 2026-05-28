# GymBaddies v7.3.11 Layout Polish Deploy

Diese ZIP ist die aktuelle saubere Deploy-Version für GitHub Pages.

## Inhalt

- `index.html`
- `sw.js`
- `manifest.webmanifest`
- `icon.svg`
- `css/`
- `js/`
- `vendor/`
- `assets/exercises/`

Der Ordner `assets/` muss mit gepusht werden, weil dort die lokalen Übungsbilder liegen.

## Neu in v7.3.11

- Home-Karte und Begrüßung sauberer begrenzt, damit Namen nicht aus Kästen laufen.
- Header-Abstände und Profilbutton zentraler ausgerichtet.
- Profilmenü mit lokalen SVG-Icons ergänzt.
- Profilmenü auf dem Handy weiter oberhalb der Bottom-Navigation positioniert.
- Übungskarten wieder näher am vorherigen Design.
- Offene Übung nutzt wieder eine größere Bild-/Hero-Ansicht.
- Notizen/RPE und Eingabebereiche bleiben kompakter.
- Zusatzübung hinzufügen ist nach unten gewandert und schmaler dargestellt.
- Rest-Timer bleibt beim Verschieben in einer festen Größe.
- Service-Worker-Cache auf v7.3.11 angehoben.

## GitHub Pages Push

ZIP entpacken und den Inhalt direkt in dein Repository kopieren. Nicht den entpackten Ordner selbst hochladen.

Danach:

```bash
git pull
git add .
git commit -m "Update GymBaddies v7.3.11 layout polish"
git push
```

Nach dem Deploy die PWA/Website auf dem Handy komplett schließen und neu öffnen, damit der neue Service Worker geladen wird.

## Supabase

Es gibt keine neue Tabelle und keine neuen Sync-Gruppen. `js/supabase.js`, `gymbaddies_sync`, `gymbaddies-shared` und der bestehende kleine gemeinsame Sync bleiben unverändert.
