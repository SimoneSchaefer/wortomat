import type { StrandColor } from '@wortomat/shared';

/** In the order they are picked (same as the backend). */
export const STRAND_COLORS: readonly StrandColor[] = [
  'violet',
  'teal',
  'rose',
  'amber',
  'blue',
  'green',
  'coral',
  'slate',
];

export function strandColor(color: StrandColor): string {
  return `var(--strand-${color})`;
}
