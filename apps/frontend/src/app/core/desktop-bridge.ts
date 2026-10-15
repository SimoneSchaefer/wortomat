import { InjectionToken } from '@angular/core';
import type { DesktopBridge } from '@wortomat/shared';

declare global {
  interface Window {
    /** Provided by the Electron preload; missing in a normal browser. */
    wortomat?: DesktopBridge;
  }
}

/** `null` in browser mode. */
export const DESKTOP_BRIDGE = new InjectionToken<DesktopBridge | null>('DESKTOP_BRIDGE', {
  providedIn: 'root',
  factory: () => window.wortomat ?? null,
});
