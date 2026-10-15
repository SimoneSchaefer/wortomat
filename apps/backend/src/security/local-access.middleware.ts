import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AUTH_HEADER } from '../config.js';
import { requestLanguage } from '../i18n.js';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Protects the local server from requests that do not come from our app:
 *
 * - The Host header check prevents DNS rebinding (a foreign website whose domain suddenly
 *   points to 127.0.0.1).
 * - The token keeps other websites in the user's normal browser, and other local programs,
 *   from calling the API. Electron adds it automatically.
 */
export function localAccessMiddleware(token: string | undefined) {
  const expected = token ? Buffer.from(token) : null;

  return (req: Request, res: Response, next: NextFunction): void => {
    const port = req.socket.localPort;
    const host = req.headers.host;
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
      const message = requestLanguage(req) === 'en' ? 'Invalid host.' : 'Ungültiger Host.';
      res.status(403).json({ statusCode: 403, message });
      return;
    }

    if (expected) {
      const given = req.headers[AUTH_HEADER];
      const givenBuffer = typeof given === 'string' ? Buffer.from(given) : null;
      if (
        !givenBuffer ||
        givenBuffer.length !== expected.length ||
        !timingSafeEqual(givenBuffer, expected)
      ) {
        const message = requestLanguage(req) === 'en' ? 'Not authorized.' : 'Nicht autorisiert.';
        res.status(401).json({ statusCode: 401, message });
        return;
      }
    }

    res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  };
}
