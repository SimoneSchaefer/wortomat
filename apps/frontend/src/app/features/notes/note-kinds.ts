import type { EditorDoc, NoteKind } from '@wortomat/shared';

/** Texte je Art (Bezeichnung, Platzhalter, Gliederung …): `t().noteKinds[kind]`. */
export interface NoteKindConfig {
  kind: NoteKind;
  /** Pfad unter /write, z. B. `characters`. */
  path: string;
  /** Eigene Bildergalerie (erstes Bild = Profilbild, auch als Avatar in der Liste). */
  gallery: boolean;
  /** Symbol in der leeren Galerie. */
  galleryIcon: 'person' | 'picture';
  /** Mit Szenen verknüpfbar („kommt vor in …“). */
  linkable: boolean;
  /** Lässt sich auf Karten einzeichnen (Vorschau der Lage auf der Seite). */
  mappable: boolean;
}

export const NOTE_KINDS: Record<NoteKind, NoteKindConfig> = {
  character: {
    kind: 'character',
    path: 'characters',
    gallery: true,
    galleryIcon: 'person',
    linkable: true,
    mappable: false,
  },
  place: {
    kind: 'place',
    path: 'places',
    gallery: true,
    galleryIcon: 'picture',
    linkable: true,
    mappable: true,
  },
  research: {
    kind: 'research',
    path: 'research',
    gallery: true,
    galleryIcon: 'picture',
    linkable: false,
    mappable: false,
  },
};

export const NOTE_KIND_LIST: readonly NoteKindConfig[] = Object.values(NOTE_KINDS);

/**
 * Vorgeschlagene Gliederung für neue Einträge – frei änderbar: Zwischenüberschriften mit
 * je einem leeren Absatz darunter. Ohne Überschriften `null` (leeres Dokument).
 */
export function outlineDoc(headings: readonly string[]): EditorDoc | null {
  if (!headings.length) return null;
  return {
    type: 'doc',
    content: headings.flatMap((text) => [
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] },
      { type: 'paragraph' },
    ]),
  };
}
