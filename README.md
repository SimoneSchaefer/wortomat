# Wortomat 2.0

Software zum Schreiben von Büchern und Romanen – als Desktop-App für Windows, macOS und Linux.
Läuft komplett lokal: kein Server, keine Installation von Java o. Ä. beim Benutzer.

## Architektur

```
┌──────────────────────── Electron-App (ein Installer) ────────────────────────┐
│  Hauptprozess (Node.js)                                                      │
│   └─ NestJS-REST-Backend auf 127.0.0.1:<zufälliger Port>                      │
│        ├─ /api/…        JSON-API                                             │
│        └─ /             liefert das gebaute Angular-Frontend aus             │
│                                                                              │
│  Fenster (Chromium)                                                          │
│   └─ Angular-Frontend  ── fetch /api/… ──►  Backend                          │
│        (Electron hängt an jede Anfrage automatisch ein Zufalls-Token an)     │
└──────────────────────────────────────────────────────────────────────────────┘
                         │
                         ▼
              MeinRoman.wortomat  (eine SQLite-Datei pro Buch)
```

| Paket | Inhalt |
|---|---|
| [`libs/shared`](libs/shared/src/index.ts) | API-Vertrag: nur TypeScript-Typen, von allen anderen Paketen genutzt |
| [`apps/backend`](apps/backend/src) | NestJS 12 – Projektdatei, Manuskript, Bilder, Volltextsuche |
| [`apps/frontend`](apps/frontend/src) | Angular 22 (zoneless, Signals) mit Tiptap-Editor |
| [`apps/desktop`](apps/desktop/src) | Electron-Shell: startet das Backend, Fenster, native Dialoge |

### Wichtige Entscheidungen

- **Datenhaltung:** Ein Buch = eine `.wortomat`-Datei (SQLite). Lässt sich kopieren, mailen und sichern
  wie ein Word-Dokument, ist dabei absturzsicher (WAL, Transaktionen). Schema-Migrationen stehen in
  [`schema.ts`](apps/backend/src/database/schema.ts) und laufen beim Öffnen automatisch.
- **`node:sqlite` statt `better-sqlite3`:** In Node/Electron eingebaut, inkl. FTS5-Volltextsuche.
  Dadurch gibt es **keine nativen Module** und kein plattformspezifisches Neukompilieren.
- **Ein Bundle:** Electron-Hauptprozess und Backend werden mit esbuild zu *einer* Datei gebündelt
  ([`bundle.mjs`](apps/desktop/scripts/bundle.mjs)). Die fertige App enthält keinen `node_modules`-Ordner.
- **Texte** werden pro Szene als ProseMirror-JSON gespeichert (nicht HTML) – Grundlage für späteren
  Export nach DOCX/EPUB/PDF. Gespeichert wird automatisch 0,8 s nach der letzten Eingabe und
  zusätzlich vor dem Schließen des Fensters bzw. Beenden der App.
- **Projektliste:** Jede angelegte oder geöffnete Datei wird in `projects.json` im App-Datenordner
  vermerkt (Electron: `userData`, z. B. `~/.config/Wortomat`; `npm run dev`: `~/.wortomat-dev`).
  Gespeichert sind nur Pfade – Titel und Wortzahl liest die Startseite jedes Mal frisch aus den Dateien.
- **Bilder** werden im Frontend auf max. 2400 px verkleinert (WebP) und als BLOB in der Projektdatei
  gespeichert. Das Backend prüft das Format anhand der Dateisignatur; SVG ist bewusst nicht erlaubt.
- **Sicherheit des lokalen Servers:** nur `127.0.0.1`, Host-Header-Prüfung (gegen DNS-Rebinding),
  Zufalls-Token pro Start, Content-Security-Policy, Renderer in Sandbox ohne Node-Zugriff.
- **IPC** zwischen Fenster und Hauptprozess nur für native Dinge (Dateidialoge, Schließen) –
  alle Daten laufen über REST.

## Entwicklung

Voraussetzung: Node.js ≥ 24.15 (siehe [`.nvmrc`](.nvmrc), z. B. `nvm use`).

```bash
npm install
```

**Im Browser entwickeln** (schnellster Zyklus; Backend + Angular-Dev-Server mit Live-Reload):

```bash
npm run dev
```

→ http://localhost:4200 – Projektpfade werden hier von Hand eingegeben (keine nativen Dialoge).

**In Electron entwickeln** (Angular-Dev-Server mit Live-Reload, Backend im Electron-Prozess):

```bash
npm run dev:desktop
```

Änderungen am Backend oder an `apps/desktop` erfordern hier einen Neustart.

**Fertige App lokal starten** (alles gebaut, wie beim Benutzer):

```bash
npm run start:desktop
```

**Tests & Typprüfung:**

```bash
npm run typecheck && npm test
```

**Installer bauen** (für das aktuelle Betriebssystem, Ergebnis in `apps/desktop/release/`):

```bash
npm run dist
```

Installer für alle drei Plattformen baut der GitHub-Workflow
[`build.yml`](.github/workflows/build.yml), sobald ein Tag wie `v2.0.0` gepusht wird.

## REST-API

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/app` | Version, Modus (desktop/browser) |
| GET | `/api/project` | geöffnetes Projekt oder `null` |
| POST | `/api/project/create` · `/open` · `/close` | Projektdatei anlegen / öffnen / schließen |
| PATCH | `/api/project` | Titel, Autor |
| GET | `/api/projects` | alle bekannten Projekte für die Startseite (zuletzt verwendet zuerst) |
| POST | `/api/projects/forget` | Projekt aus der Liste nehmen (Datei bleibt erhalten) |
| GET · POST | `/api/nodes` | Manuskript-Baum (Teil → Kapitel → Szene) |
| PATCH · DELETE | `/api/nodes/:id` | umbenennen, löschen (inkl. Unterelemente) |
| POST | `/api/nodes/:id/move` | verschieben: `{ parentId, beforeId }` → kompletter Baum |
| GET · PUT | `/api/scenes/:id/content` | Szenentext laden / speichern |
| POST | `/api/images` | Bild hochladen (multipart, Feld `file`) |
| GET | `/api/images/:id` | Bild abrufen |
| GET | `/api/search?q=…` | Volltextsuche (findet „Häuser“ auch mit „hauser“) |

## Offene Punkte / nächste Schritte

- App-Icon: `apps/desktop/build/icon.png` (1024×1024) ablegen
- Code-Signing für Windows und macOS (sonst warnen SmartScreen bzw. Gatekeeper)
- Umsortieren per Tastatur (Drag & Drop ist nur mit der Maus bedienbar)
- Versionen/Snapshots von Szenen, nicht mehr verwendete Bilder aufräumen
- Export (DOCX, EPUB, PDF über `webContents.printToPDF`)
- Import der Daten aus Wortomat 1.x
- Automatische Backups (`VACUUM INTO`)
