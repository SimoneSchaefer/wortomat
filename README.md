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
| [`apps/frontend`](apps/frontend/src) | Angular 22 (zoneless, Signals): Manuskript, Charaktere, Orte, Forschung; Tiptap-Editor |
| [`apps/desktop`](apps/desktop/src) | Electron-Shell: startet das Backend, Fenster, native Dialoge |

### Wichtige Entscheidungen

- **Datenhaltung:** Ein Buch = eine `.wortomat`-Datei (SQLite). Lässt sich kopieren, mailen und sichern
  wie ein Word-Dokument, ist dabei absturzsicher (WAL, Transaktionen). Schema-Migrationen stehen in
  [`schema.ts`](apps/backend/src/database/schema.ts) und laufen beim Öffnen automatisch.
- **`node:sqlite` statt `better-sqlite3`:** In Node/Electron eingebaut, inkl. FTS5-Volltextsuche.
  Dadurch gibt es **keine nativen Module** und kein plattformspezifisches Neukompilieren.
- **Ein Bundle:** Electron-Hauptprozess und Backend werden mit esbuild zu *einer* Datei gebündelt
  ([`bundle.mjs`](apps/desktop/scripts/bundle.mjs)). Die fertige App enthält keinen `node_modules`-Ordner.
- **Charaktere, Orte, Forschung** sind „Notizen“ (Tabelle `notes`): Titel, einzeilige Kurzbeschreibung
  und ein Text im selben Editor wie die Szenen. Neue Charaktere und Orte starten mit vorgeschlagenen
  Zwischenüberschriften ([`note-kinds.ts`](apps/frontend/src/app/features/notes/note-kinds.ts)).
  Der Editor ([`document-editor.ts`](apps/frontend/src/app/features/editor/document-editor.ts)) ist
  für Szenen und Notizen derselbe; was er lädt und speichert, bestimmt eine `DocumentSource`.
- **Profilbilder:** Charaktere, Orte und Recherchen haben je eine eigene Bildergalerie (Tabelle
  `note_images`); das erste Bild ist das Profilbild und erscheint als Avatar in der Liste. Gewischt wird über einen
  horizontalen Streifen mit CSS-Scroll-Snapping (Touch/Trackpad nativ), dazu Maus-Ziehen,
  Pfeiltasten, Pfeile und Punkte. Pro Notizart per `gallery` in `note-kinds.ts` abschaltbar. Entfernte Bilder werden aus der Datei gelöscht, sofern sie nirgends sonst
  (Galerie oder Text) verwendet werden.
- **Verknüpfungen:** Szenen lassen sich mit Charakteren und Orten verknüpfen (Tabelle
  `scene_links`, Löschen räumt per Fremdschlüssel automatisch auf). In der Szene stehen sie als
  Chips unter dem Titel – mit Suche, die Umlaute ignoriert, und Neuanlage direkt aus der Suche.
  Charaktere und Orte zeigen umgekehrt „Kommt vor in“ in Manuskript-Reihenfolge. Welche
  Notizarten verknüpfbar sind, steuert `linkable` in `note-kinds.ts`.
- **Szenenstatus:** Idee → Struktur → Erster Entwurf → Überarbeiteter Entwurf → Fertig (Spalte
  `nodes.status`, per `CHECK` abgesichert; neue und bestehende Szenen starten als „Idee“). In der
  Szene als Stufenleiste, im Manuskript-Baum als farbiger Punkt; Farben in `styles.scss`.
- **Todo/Idee/Fixme im Text:** eigene Tiptap-Mark-Erweiterung
  ([`annotation-mark.ts`](apps/frontend/src/app/features/editor/annotation-mark.ts)), Werkzeugleiste
  oder Strg+Alt+T/I/F. Farbig hinterlegt und je Art anders unterstrichen (auch ohne Farbwahrnehmung
  unterscheidbar). Das Backend zählt beim Speichern selbst
  ([`annotations.ts`](apps/backend/src/manuscript/annotations.ts)) – zusammenhängend markierter Text
  zählt einmal –, der Manuskript-Baum zeigt die Zahlen je Szene und als Summe je Kapitel/Teil.
- **Export** (Schaltfläche „Exportieren …“ oben): HTML (eine Datei, Bilder eingebettet), Word
  (.docx, Bibliothek `docx`), EPUB 3 (eine Datei je Kapitel, verschachteltes Inhaltsverzeichnis plus
  `toc.ncx` für ältere Reader) und – wenn pdfLaTeX gefunden wird – PDF. Für Word und PDF gibt es die
  Vorlagen **Normseite** (A4, Courier 12 pt, 30 × 60 Anschläge, Titelseite mit Wort- und
  Normseitenzahl) und **Roman** (12,5 × 19 cm, Blocksatz, Silbentrennung). Code in
  [`apps/backend/src/export`](apps/backend/src/export): ein formatneutrales Buchmodell, je Format ein
  Renderer. pdfLaTeX wird im PATH und in den üblichen Ordnern von MacTeX, TeX Live und MiKTeX
  gesucht (Desktop-Apps sehen den Shell-PATH nicht) und läuft mit `-no-shell-escape`.
  Todo/Idee/Fixme-Markierungen werden nicht mitexportiert. Word und pdfLaTeX können kein WebP –
  neue Bilder werden daher als JPEG/PNG gespeichert; ältere WebP-Bilder erscheinen dort als
  Platzhalter mit Hinweis (im EPUB sind sie dabei, AVIF fällt dort weg). Die EPUB-Kennung wird aus
  dem Anlagezeitpunkt des Buchs abgeleitet und bleibt so über alle Exporte gleich.
- **Titelbild** (im Export-Dialog bei EPUB): eigenes Bild wählen oder „Aus Titel gestalten“ – ein
  typografisches Cover (1600 × 2560 px, JPEG) wird im Browser per Canvas gezeichnet
  ([`cover-design.ts`](apps/frontend/src/app/core/cover-design.ts)), jeder weitere Klick wechselt
  die Farben. Gespeichert als Bild in der Projektdatei (`project.cover_image_id`); ein ersetztes
  Titelbild wird gelöscht, wenn es sonst nirgends vorkommt. Im EPUB als `cover-image` mit eigener,
  seitenfüllender Cover-Seite (SVG, damit nichts verzerrt).
- **Tags:** freie Schlagwörter je Szene (Tabellen `tags`, `scene_tags`), in derselben Leiste wie die
  Verknüpfungen. Tags gehören zum Projekt und werden über den Namen wiederverwendet – Groß-/
  Kleinschreibung (auch Umlaute) und ein führendes `#` spielen keine Rolle. Ungenutzte Tags
  verschwinden aus den Vorschlägen und werden beim nächsten Entfernen aufgeräumt.
- **Aufbau des Arbeitsbereichs:** Oben eine Leiste für das ganze Buch (Titel, Wortzahl, Suche,
  „Projekt schließen“), darunter Menüleiste, Liste des aktuellen Bereichs und Inhalt. Die Suche
  (Strg+K / ⌘K) durchsucht Szenen und Notizen und zeigt die Treffer nach Bereich gruppiert.
  Die Seitenleiste lässt sich am rechten Rand breiter ziehen (auch per Tastatur, Doppelklick =
  Standard).
- **App-Einstellungen** (z. B. diese Breite) liegen in `settings.json` im App-Datenordner, nicht im
  `localStorage`: Electron startet das Backend auf einem zufälligen Port, und `localStorage` hängt
  am Origin – er wäre nach jedem Start leer.
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

Unter Linux mit GNOME/Wayland zeigt die Shell das App-Icon nur, wenn es einen passenden
Starter-Eintrag gibt. Für die beiden Starts oben legt ihn einmalig an:

```bash
npm run desktop-entry -w @wortomat/desktop
```

**Tests & Typprüfung:**

```bash
npm run typecheck && npm test
```

**End-to-End-Tests** (Playwright, Chromium und Firefox): klicken die wichtigsten Abläufe – Buch
anlegen und wieder öffnen, schreiben, Szenen löschen, Charaktere verknüpfen, Suche, Export,
Korrekturfassung – in der gebauten App gegen das echte Backend durch. Das Backend läuft dafür auf
Port 3101 (anderer Port: `E2E_PORT=3102`) und legt alles in `e2e/.tmp/<port>/` ab, eigene Bücher
und `~/Downloads` bleiben unberührt.

```bash
npx playwright install chromium firefox   # einmalig
npm run build && npm run e2e
```

Einzelne Tests oder Browser: `npm run e2e -- --project=firefox tests/writing.spec.ts`,
mit `--ui` interaktiv.

**Installer bauen** (für das aktuelle Betriebssystem, Ergebnis in `apps/desktop/release/`):

```bash
npm run dist
```

**GitHub Actions:**

- [`ci.yml`](.github/workflows/ci.yml) prüft Typen, baut und testet bei jedem Push und Pull Request;
  ein zweiter Job führt die End-to-End-Tests aus und legt bei Fehlern den Playwright-Bericht
  (mit Traces) als Artefakt ab.
- „Release Linux“, „Release Windows“ und „Release macOS“ bauen die Installer im Release-Modus
  auf dem jeweiligen Betriebssystem. Sie laufen nur von Hand (Actions → Workflow → „Run workflow“)
  und legen die Installer als Artefakt am Lauf ab. Den gemeinsamen Ablauf beschreibt
  [`release-build.yml`](.github/workflows/release-build.yml). Die Installer sind nicht signiert.

## REST-API

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/app` | Version, Modus (desktop/browser) |
| GET · PATCH | `/api/settings` | App-Einstellungen (z. B. `sidebarWidth`), auch ohne geöffnetes Projekt |
| GET | `/api/project` | geöffnetes Projekt oder `null` |
| POST | `/api/project/create` · `/open` · `/close` | Projektdatei anlegen / öffnen / schließen |
| PATCH | `/api/project` | Titel, Autor, Titelbild (`coverImageId`, `null` entfernt) |
| GET | `/api/projects` | alle bekannten Projekte für die Startseite (zuletzt verwendet zuerst) |
| POST | `/api/projects/forget` | Projekt aus der Liste nehmen (Datei bleibt erhalten) |
| GET · POST | `/api/nodes` | Manuskript-Baum (Teil → Kapitel → Szene) |
| PATCH · DELETE | `/api/nodes/:id` | umbenennen / Szenenstatus setzen (`{ title?, status? }`), löschen (inkl. Unterelemente) |
| POST | `/api/nodes/:id/move` | verschieben: `{ parentId, beforeId }` → kompletter Baum |
| GET · PUT | `/api/scenes/:id/content` | Szenentext laden / speichern |
| POST | `/api/images` | Bild hochladen (multipart, Feld `file`) |
| GET | `/api/images/:id` | Bild abrufen |
| GET · POST | `/api/notes` (`?kind=character\|place\|research`) | Charaktere, Orte, Recherchen |
| PATCH · DELETE | `/api/notes/:id` | Titel, Kurzbeschreibung; löschen |
| GET · PUT | `/api/notes/:id/content` | Text einer Notiz laden / speichern |
| GET · POST | `/api/scenes/:id/links` | verknüpfte Charaktere/Orte · verknüpfen `{ noteId }` |
| DELETE | `/api/scenes/:id/links/:noteId` | Verknüpfung lösen |
| GET | `/api/tags` | alle verwendeten Tags mit Anzahl der Szenen |
| GET · POST | `/api/scenes/:id/tags` | Tags der Szene · vergeben per `{ name }` |
| DELETE | `/api/scenes/:id/tags/:tagId` | Tag von der Szene entfernen |
| GET | `/api/notes/:id/scenes` | Szenen, in denen eine Notiz vorkommt (Manuskript-Reihenfolge, mit Pfad) |
| GET · POST · PUT | `/api/notes/:id/images` | Galerie abrufen / Bild hinzufügen (multipart) / umsortieren |
| DELETE | `/api/notes/:id/images/:imageId` | Bild aus der Galerie entfernen |
| GET | `/api/export/capabilities` | Ist pdfLaTeX verfügbar (mit Version)? |
| POST | `/api/export` | `{ format, template, includeSceneTitles, filePath? }` – mit Pfad schreiben, sonst Download |
| GET | `/api/search?q=…` | Volltextsuche über Szenen und Notizen (findet „Häuser“ auch mit „hauser“) |

## Offene Punkte / nächste Schritte

- Code-Signing für Windows und macOS (sonst warnen SmartScreen bzw. Gatekeeper)
- Umsortieren per Tastatur (Drag & Drop ist nur mit der Maus bedienbar)
- Versionen/Snapshots von Szenen, nicht mehr verwendete Bilder aufräumen
- Import der Daten aus Wortomat 1.x
- Automatische Backups (`VACUUM INTO`)
