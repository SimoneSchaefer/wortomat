import type { ProofPackage } from '@wortomat/shared';
import { readerApp } from './reader-app.js';

/** Für ruhiges Lesen auf dem Handy: Serifenschrift, viel Zeilenabstand, hell und dunkel. */
const READER_CSS = `
:root {
  color-scheme: light dark;
  --bg: #fffdfa; --surface: #f6f3ee; --border: #e3ddd4; --text: #1f1b17; --muted: #6b645c;
  --accent: #84cc16; --accent-strong: #4d7c0f; --fixme: #d64545; --suggest: #2a78d6;
  --font-scale: 1;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1b1a19; --surface: #232220; --border: #3b3835; --text: #eeeae4; --muted: #a19a91;
    --accent: #a3e635; --accent-strong: #bef264; --fixme: #f07070; --suggest: #5b9cf0;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text);
  font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
button { font: inherit; color: inherit; cursor: pointer; padding: 0.55rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border)); border-radius: 0.6rem;
  background: color-mix(in srgb, var(--accent) 10%, var(--bg)); }
button:disabled { opacity: 0.45; cursor: default; }
button.primary { background: var(--accent-strong); border-color: var(--accent-strong); color: var(--bg); }
button.danger { color: var(--fixme); }
button.link { padding: 0.4rem 0.6rem; border: none; background: none; }
.muted { color: var(--muted); }
.bar { position: sticky; top: 0; z-index: 2; display: flex; align-items: center;
  justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0.6rem;
  background: color-mix(in srgb, var(--accent) 30%, var(--bg));
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1); }
.bar-title { padding: 0 0.4rem; font-weight: 600; overflow: hidden; white-space: nowrap;
  text-overflow: ellipsis; }
.notes-button { display: flex; align-items: center; gap: 0.35rem; }
.badge { min-width: 1.4rem; padding: 0 0.35rem; border-radius: 999px; text-align: center;
  background: var(--fixme); color: #fff; font-size: 0.8rem; font-weight: 600; }
main { max-width: 38rem; margin: 0 auto; padding: 1rem 1.1rem 7rem; }
h1 { margin: 0.2rem 0 1rem; font: 400 1.8rem/1.25 Georgia, 'Iowan Old Style', serif; }
h2 { margin: 1.6rem 0 0.6rem; font-size: 1rem; }
.kicker { margin: 0.5rem 0 0; font-size: 0.75rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted); }
.cover { display: grid; gap: 0.4rem; justify-items: start; padding: 1rem 0; }
.cover h1 { margin: 0; font-size: 2.1rem; }
.cover p { margin: 0; }
.author { font-style: italic; }
.send { display: grid; gap: 0.5rem; justify-items: start; margin: 1rem 0; padding: 0.9rem 1rem;
  border: 1px solid var(--border); border-radius: 0.8rem; background: var(--surface); }
.send p { margin: 0; font-size: 0.9rem; }
.chapters, .note-list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.4rem; }
.chapters button, .note-list button { display: flex; align-items: baseline; gap: 0.6rem;
  width: 100%; text-align: left; background: var(--surface); border-color: var(--border); }
.chapters .part { margin-top: 0.8rem; font-size: 0.75rem; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--muted); }
.number { min-width: 1.6rem; font-weight: 600; color: var(--muted); }
.chapter-title { flex: 1; }
.font-size { display: flex; align-items: center; gap: 0.5rem; margin-top: 2rem; }
.chapter-heading { margin-bottom: 0.5rem; }
.scene { font: calc(1.15rem * var(--font-scale))/1.65 Georgia, 'Iowan Old Style', serif; }
.scene-title { margin: 2rem 0 0.8rem; font: 600 0.8rem/1.4 system-ui, sans-serif;
  letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.para { margin: 0; white-space: pre-wrap; overflow-wrap: break-word; }
.para + .para { text-indent: 1.4em; }
.para.empty { min-height: 0.8em; }
mark.note { color: inherit; background: color-mix(in srgb, var(--fixme) 22%, transparent);
  border-bottom: 2px solid var(--fixme); border-radius: 0.15rem; cursor: pointer; }
mark.note.suggestion { background: color-mix(in srgb, var(--suggest) 20%, transparent);
  border-bottom-color: var(--suggest); }
mark.flash { animation: flash 1.2s ease-out 2; }
@keyframes flash { 50% { background: color-mix(in srgb, var(--fixme) 55%, transparent); } }
.chapter-nav { display: flex; justify-content: space-between; gap: 0.5rem; margin-top: 2.5rem; }
.note-list button { flex-direction: column; align-items: stretch; gap: 0.2rem; }
.note-list .quote { font-family: Georgia, serif; }
.note-list .text { color: var(--muted); font-size: 0.9rem; white-space: pre-wrap; }
.actions { position: fixed; left: 0; right: 0; bottom: 0; z-index: 3; display: flex;
  justify-content: center; gap: 0.6rem; padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom));
  background: var(--surface); border-top: 1px solid var(--border);
  box-shadow: 0 -4px 16px rgb(0 0 0 / 0.12); }
.actions button { flex: 1; max-width: 12rem; }
.actions .hint { color: var(--muted); font-size: 0.9rem; text-align: center; }
.sheet-backdrop { position: fixed; inset: 0; z-index: 4; display: flex; align-items: flex-end;
  background: rgb(0 0 0 / 0.35); }
.sheet { width: 100%; max-width: 38rem; margin: 0 auto; display: grid; gap: 0.7rem;
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom)); background: var(--bg);
  border-radius: 1rem 1rem 0 0; box-shadow: 0 -8px 24px rgb(0 0 0 / 0.2); }
.sheet-quote { margin: 0; max-height: 6rem; overflow: auto; font-family: Georgia, serif;
  border-left: 3px solid var(--fixme); padding-left: 0.6rem; }
.sheet label { display: grid; gap: 0.25rem; font-size: 0.85rem; color: var(--muted); }
.sheet textarea { width: 100%; padding: 0.5rem 0.6rem; font: 1rem/1.4 system-ui, sans-serif;
  color: var(--text); background: var(--surface); border: 1px solid var(--border);
  border-radius: 0.5rem; resize: vertical; }
.sheet .replacement { font-family: Georgia, serif; }
.sheet-buttons { display: flex; gap: 0.5rem; }
.sheet-buttons > :first-child { margin-right: auto; }
.error { margin: 0; color: var(--fixme); font-size: 0.9rem; }
.warning { padding: 0.7rem 0.9rem; border-radius: 0.6rem; color: var(--fixme);
  background: color-mix(in srgb, var(--fixme) 12%, var(--bg)); }
.toast { position: fixed; left: 1rem; right: 1rem; bottom: 5rem; z-index: 5; max-width: 30rem;
  margin: 0 auto; padding: 0.7rem 1rem; border-radius: 0.6rem; background: var(--text);
  color: var(--bg); box-shadow: 0 4px 16px rgb(0 0 0 / 0.25); }
[hidden] { display: none !important; }
`;

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}

/**
 * Die Korrekturfassung als eigenständige HTML-Datei: Styles, Daten und Lese-App stecken darin,
 * sie läuft ohne Netz. Die Daten stehen als JSON in einem eigenen Skript-Block; `<` wird dort
 * als `<` geschrieben, damit ein „</script>“ im Buchtext den Block nicht vorzeitig beendet.
 */
export function readerHtml(proof: ProofPackage): string {
  const data = JSON.stringify(proof).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(proof.title)} – Korrekturfassung</title>
<style>${READER_CSS}</style>
</head>
<body>
<noscript>Diese Korrekturfassung braucht JavaScript – bitte in Chrome öffnen.</noscript>
<script type="application/json" id="proof-data">${data}</script>
<script>(${readerApp.toString()})();</script>
</body>
</html>
`;
}
