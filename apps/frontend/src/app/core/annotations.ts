import type { AnnotationCounts, AnnotationKind } from '@wortomat/shared';

/** Bezeichnung der Art: `t().annotations[kind]`. */
export interface AnnotationInfo {
  kind: AnnotationKind;
  /** Taste für Strg+Alt+… (⌘+Alt auf dem Mac). */
  key: string;
  /** CSS-Variable mit der Farbe (in styles.scss, hell und dunkel). */
  color: string;
}

export const ANNOTATION_KINDS: readonly AnnotationInfo[] = [
  { kind: 'todo', key: 'T', color: 'var(--annotation-todo)' },
  { kind: 'idea', key: 'I', color: 'var(--annotation-idea)' },
  { kind: 'fixme', key: 'F', color: 'var(--annotation-fixme)' },
];

export const NO_ANNOTATIONS: AnnotationCounts = { todo: 0, idea: 0, fixme: 0 };

export function addCounts(a: AnnotationCounts, b: AnnotationCounts): AnnotationCounts {
  return { todo: a.todo + b.todo, idea: a.idea + b.idea, fixme: a.fixme + b.fixme };
}
