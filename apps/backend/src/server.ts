import 'reflect-metadata';
import { existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import type { ServerOptions } from './config.js';
import { LocalizedExceptionFilter } from './i18n.js';
import { localAccessMiddleware } from './security/local-access.middleware.js';

export { AUTH_HEADER, type ServerOptions } from './config.js';

export interface RunningServer {
  port: number;
  url: string;
  /** Fährt Nest herunter und schließt dabei das geöffnete Projekt sauber. */
  close(): Promise<void>;
}

/** Startet das REST-Backend. Wird von der Electron-Shell und von `main.ts` aufgerufen. */
export async function startServer(options: ServerOptions): Promise<RunningServer> {
  const host = options.host ?? '127.0.0.1';

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forRoot(options),
    new ExpressAdapter(),
    {
      bodyParser: false,
      logger: options.logger ?? ['log', 'warn', 'error'],
    },
  );
  app.disable('x-powered-by');
  // Szenen können groß werden; Express' Standardlimit liegt bei 100 KB.
  app.useBodyParser('json', { limit: '50mb' });
  app.use(localAccessMiddleware(options.token));
  app.setGlobalPrefix('api');
  // Fehlermeldungen in der Sprache der Oberfläche
  app.useGlobalFilters(new LocalizedExceptionFilter(app.get(HttpAdapterHost).httpAdapter));

  if (options.staticDir) {
    serveFrontend(app, options.staticDir);
  }

  await app.listen(options.port ?? 0, host);
  const { port } = app.getHttpServer().address() as AddressInfo;

  return {
    port,
    url: `http://${host}:${port}`,
    close: () => app.close(),
  };
}

/** Liefert das gebaute Angular-Frontend aus, inklusive Fallback auf index.html fürs Routing. */
function serveFrontend(app: NestExpressApplication, staticDir: string): void {
  const indexHtml = path.join(staticDir, 'index.html');
  if (!existsSync(indexHtml)) {
    throw new Error(`Frontend nicht gefunden: ${indexHtml}`);
  }
  app.useStaticAssets(staticDir, { index: false });
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isAppRoute =
      req.method === 'GET' && !req.path.startsWith('/api/') && !path.extname(req.path);
    if (isAppRoute) {
      // Mit `root` prüft Express nur den Teil danach auf Punkt-Ordner – sonst gäbe es
      // z. B. im AppImage (/tmp/.mount_…) immer 404.
      res.sendFile('index.html', { root: staticDir });
    } else {
      next();
    }
  });
}
