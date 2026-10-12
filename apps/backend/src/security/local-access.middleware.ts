import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AUTH_HEADER } from '../config.js';

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
 * Schützt den lokalen Server vor Zugriffen, die nicht von unserer App kommen:
 *
 * - Host-Header-Prüfung verhindert DNS-Rebinding (eine fremde Website, deren
 *   Domain plötzlich auf 127.0.0.1 zeigt).
 * - Das Token verhindert, dass andere Websites im normalen Browser des Benutzers
 *   oder andere lokale Programme die API aufrufen. Electron hängt es automatisch an.
 */
export function localAccessMiddleware(token: string | undefined) {
  const expected = token ? Buffer.from(token) : null;

  return (req: Request, res: Response, next: NextFunction): void => {
    const port = req.socket.localPort;
    const host = req.headers.host;
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
      res.status(403).json({ statusCode: 403, message: 'Ungültiger Host.' });
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
        res.status(401).json({ statusCode: 401, message: 'Nicht autorisiert.' });
        return;
      }
    }

    res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  };
}
