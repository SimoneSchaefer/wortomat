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
  /** Also closes the open project cleanly. */
  close(): Promise<void>;
}

/** Called by the Electron shell and by `main.ts`. */
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
  // Scenes can get large; Express's default limit is 100 KB.
  app.useBodyParser('json', { limit: '50mb' });
  app.use(localAccessMiddleware(options.token));
  app.setGlobalPrefix('api');
  // error messages in the UI language
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

/** Falls back to index.html for client-side routing. */
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
      // With `root`, Express checks only the part after it for dot folders – otherwise e.g. the
      // AppImage (/tmp/.mount_…) would always get a 404.
      res.sendFile('index.html', { root: staticDir });
    } else {
      next();
    }
  });
}
