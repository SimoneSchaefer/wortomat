import type { StrandColor } from '@wortomat/shared';

/** Alle Farben für Stränge in der Reihenfolge der Auswahl (wie im Backend). */
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

/** CSS-Farbe eines Strangs (in styles.scss, hell und dunkel). */
export function strandColor(color: StrandColor): string {
  return `var(--strand-${color})`;
}
