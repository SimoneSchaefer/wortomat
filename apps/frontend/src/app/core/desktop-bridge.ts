import { InjectionToken } from '@angular/core';
import type { DesktopBridge } from '@wortomat/shared';

declare global {
  interface Window {
    /** Vom Electron-Preload bereitgestellt; fehlt im normalen Browser. */
    wortomat?: DesktopBridge;
  }
}

/** Zugriff auf native Funktionen der Electron-Shell; `null` im Browser-Modus. */
export const DESKTOP_BRIDGE = new InjectionToken<DesktopBridge | null>('DESKTOP_BRIDGE', {
  providedIn: 'root',
  factory: () => window.wortomat ?? null,
});
