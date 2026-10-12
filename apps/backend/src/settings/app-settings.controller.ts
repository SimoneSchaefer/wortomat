import { Body, Controller, Get, Patch } from '@nestjs/common';
import type { AppSettings, UpdateAppSettingsRequest } from '@wortomat/shared';
import { AppSettingsService } from './app-settings.service.js';

/** App-Einstellungen; funktionieren auch ohne geöffnetes Projekt. */
@Controller('settings')
export class AppSettingsController {
  constructor(private readonly settings: AppSettingsService) {}

  @Get()
  get(): AppSettings {
    return this.settings.get();
  }

  @Patch()
  update(@Body() body: UpdateAppSettingsRequest): AppSettings {
    return this.settings.update(body);
  }
}
