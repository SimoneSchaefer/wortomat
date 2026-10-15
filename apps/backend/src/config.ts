import type { LogLevel } from '@nestjs/common';
import type { AppMode } from '@wortomat/shared';

export interface ServerOptions {
  mode: AppMode;
  version: string;
  defaultProjectDir: string;
  /** App data that belongs to no book, e.g. the project list. */
  dataDir: string;
  /**
   * Where notes files from the phone arrive (mail attachments, GSConnect …). Defaults to
   * ~/Downloads.
   */
  downloadsDir?: string;
  /** Defaults to 127.0.0.1. Never 0.0.0.0, or the API becomes reachable from the network. */
  host?: string;
  /** 0 picks a random free port (production in Electron). */
  port?: number;
  /** When set, every request must send this value in the {@link AUTH_HEADER} header. */
  token?: string;
  /** Without it, only the API is served. */
  staticDir?: string;
  logger?: LogLevel[] | false;
}

export const SERVER_OPTIONS = Symbol('SERVER_OPTIONS');

export const AUTH_HEADER = 'x-wortomat-token';
