import type { AnnotationCounts, AnnotationKind } from '@wortomat/shared';

export interface AnnotationInfo {
  kind: AnnotationKind;
  label: string;
  plural: string;
  /** Taste für Strg+Alt+… (⌘+Alt auf dem Mac). */
  key: string;
  /** CSS-Variable mit der Farbe (in styles.scss, hell und dunkel). */
  color: string;
}

export const ANNOTATION_KINDS: readonly AnnotationInfo[] = [
  { kind: 'todo', label: 'Todo', plural: 'Todos', key: 'T', color: 'var(--annotation-todo)' },
  { kind: 'idea', label: 'Idee', plural: 'Ideen', key: 'I', color: 'var(--annotation-idea)' },
  { kind: 'fixme', label: 'Fixme', plural: 'Fixmes', key: 'F', color: 'var(--annotation-fixme)' },
];

export const NO_ANNOTATIONS: AnnotationCounts = { todo: 0, idea: 0, fixme: 0 };

export function addCounts(a: AnnotationCounts, b: AnnotationCounts): AnnotationCounts {
  return { todo: a.todo + b.todo, idea: a.idea + b.idea, fixme: a.fixme + b.fixme };
}

export function annotationLabel(kind: AnnotationKind): string {
  return ANNOTATION_KINDS.find((info) => info.kind === kind)?.label ?? kind;
}
