import type { SceneStatus } from '@wortomat/shared';

/** Name of the status: `t().sceneStatus.names[status]`. */
export interface SceneStatusInfo {
  status: SceneStatus;
  /** CSS variable with the colour (in styles.scss, light and dark). */
  color: string;
}

/** In working order. */
export const SCENE_STATUSES: readonly SceneStatusInfo[] = [
  { status: 'idea', color: 'var(--status-idea)' },
  { status: 'outline', color: 'var(--status-outline)' },
  { status: 'draft', color: 'var(--status-draft)' },
  { status: 'revised', color: 'var(--status-revised)' },
  { status: 'final', color: 'var(--status-final)' },
];

export function statusInfo(status: SceneStatus): SceneStatusInfo {
  return SCENE_STATUSES.find((info) => info.status === status) ?? SCENE_STATUSES[0]!;
}
