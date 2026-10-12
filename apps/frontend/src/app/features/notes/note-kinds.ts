import type { EditorDoc, NoteKind } from '@wortomat/shared';

export interface NoteKindConfig {
  kind: NoteKind;
  /** Pfad unter /write, z. B. `characters`. */
  path: string;
  label: string;
  singular: string;
  newTitle: string;
  addLabel: string;
  emptyList: string;
  summaryPlaceholder: string;
  textPlaceholder: string;
  /** Eigene Bildergalerie (erstes Bild = Profilbild, auch als Avatar in der Liste). */
  gallery: boolean;
  /** Vorgeschlagene Gliederung für neue Einträge – frei änderbar. */
  template: EditorDoc | null;
}

export const NOTE_KINDS: Record<NoteKind, NoteKindConfig> = {
  character: {
    kind: 'character',
    path: 'characters',
    label: 'Charaktere',
    singular: 'Charakter',
    newTitle: 'Neuer Charakter',
    addLabel: '+ Charakter',
    emptyList: 'Noch keine Charaktere.',
    summaryPlaceholder: 'Kurzbeschreibung, z. B. „Protagonistin, 34, Ärztin in Hamburg“',
    textPlaceholder: 'Wer ist diese Figur?',
    gallery: true,
    template: outline([
      'Äußeres',
      'Persönlichkeit',
      'Hintergrund',
      'Ziele & Motivation',
      'Rolle in der Geschichte',
    ]),
  },
  place: {
    kind: 'place',
    path: 'places',
    label: 'Orte',
    singular: 'Ort',
    newTitle: 'Neuer Ort',
    addLabel: '+ Ort',
    emptyList: 'Noch keine Orte.',
    summaryPlaceholder: 'Kurzbeschreibung, z. B. „Alter Fischereihafen, Nordseeküste“',
    textPlaceholder: 'Wie sieht es hier aus?',
    gallery: false,
    template: outline(['Beschreibung', 'Atmosphäre', 'Bedeutung für die Geschichte']),
  },
  research: {
    kind: 'research',
    path: 'research',
    label: 'Forschung',
    singular: 'Recherche',
    newTitle: 'Neue Recherche',
    addLabel: '+ Recherche',
    emptyList: 'Noch keine Recherchen.',
    summaryPlaceholder: 'Worum geht es? z. B. „Gezeiten an der Nordsee“',
    textPlaceholder: 'Notizen, Zitate, Quellen …',
    gallery: false,
    template: null,
  },
};

export const NOTE_KIND_LIST: readonly NoteKindConfig[] = Object.values(NOTE_KINDS);

/** Zwischenüberschriften mit je einem leeren Absatz darunter. */
function outline(headings: string[]): EditorDoc {
  return {
    type: 'doc',
    content: headings.flatMap((text) => [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] },
      { type: 'paragraph' },
    ]),
  };
}
