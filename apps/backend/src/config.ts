import type { LogLevel } from '@nestjs/common';
import type { AppMode } from '@wortomat/shared';

export interface ServerOptions {
  mode: AppMode;
  version: string;
  defaultProjectDir: string;
  /** Standard: 127.0.0.1. Niemals 0.0.0.0, sonst ist die API im Netzwerk erreichbar. */
  host?: string;
  /** 0 = zufälliger freier Port (Produktion in Electron). */
  port?: number;
  /** Wenn gesetzt, muss jede Anfrage diesen Wert im Header {@link AUTH_HEADER} mitschicken. */
  token?: string;
  /** Verzeichnis mit dem gebauten Angular-Frontend. Ohne Angabe wird nur die API bereitgestellt. */
  staticDir?: string;
  logger?: LogLevel[] | false;
}

export const SERVER_OPTIONS = Symbol('SERVER_OPTIONS');

/** Header, den die Electron-Shell automatisch an jede Anfrage anhängt. */
export const AUTH_HEADER = 'x-wortomat-token';
