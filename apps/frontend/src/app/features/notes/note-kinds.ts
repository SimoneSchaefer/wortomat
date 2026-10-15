import type { EditorDoc, NoteKind } from '@wortomat/shared';

/** Texts per kind (label, placeholder, outline …): `t().noteKinds[kind]`. */
export interface NoteKindConfig {
  kind: NoteKind;
  /** Path below /write, e.g. `characters`. */
  path: string;
  /** Own image gallery (first image = profile picture, also the avatar in the list). */
  gallery: boolean;
  galleryIcon: 'person' | 'picture';
  /** Can be linked to scenes ("appears in …"). */
  linkable: boolean;
  /** Can be placed on maps (location preview on the page). */
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
 * Suggested outline for new entries – freely editable: subheadings with an empty paragraph below
 * each. Without headings `null` (empty document).
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
