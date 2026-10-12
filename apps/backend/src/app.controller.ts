import { Controller, Get, Inject } from '@nestjs/common';
import type { AppInfo } from '@wortomat/shared';
import { SERVER_OPTIONS, type ServerOptions } from './config.js';

@Controller('app')
export class AppController {
  constructor(@Inject(SERVER_OPTIONS) private readonly options: ServerOptions) {}

  @Get()
  info(): AppInfo {
    return {
      version: this.options.version,
      mode: this.options.mode,
      defaultProjectDir: this.options.defaultProjectDir,
    };
  }
}
