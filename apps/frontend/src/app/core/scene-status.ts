import type { SceneStatus } from '@wortomat/shared';

export interface SceneStatusInfo {
  status: SceneStatus;
  label: string;
  /** CSS-Variable mit der Farbe (in styles.scss, hell und dunkel). */
  color: string;
}

/** Alle Status in Arbeitsreihenfolge. */
export const SCENE_STATUSES: readonly SceneStatusInfo[] = [
  { status: 'idea', label: 'Idee', color: 'var(--status-idea)' },
  { status: 'outline', label: 'Struktur', color: 'var(--status-outline)' },
  { status: 'draft', label: 'Erster Entwurf', color: 'var(--status-draft)' },
  { status: 'revised', label: 'Überarbeiteter Entwurf', color: 'var(--status-revised)' },
  { status: 'final', label: 'Fertig', color: 'var(--status-final)' },
];

export function statusInfo(status: SceneStatus): SceneStatusInfo {
  return SCENE_STATUSES.find((info) => info.status === status) ?? SCENE_STATUSES[0]!;
}
