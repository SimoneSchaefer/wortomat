import type { AnnotationCounts, AnnotationKind } from '@wortomat/shared';

export interface AnnotationInfo {
  kind: AnnotationKind;
  /** Key for Ctrl+Alt+… (⌘+Alt on the Mac). */
  key: string;
  /** CSS variable with the colour (in styles.scss, light and dark). */
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
