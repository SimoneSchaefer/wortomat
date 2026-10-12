import { type DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { SERVER_OPTIONS, type ServerOptions } from './config.js';
import { ExportController } from './export/export.controller.js';
import { ExportService } from './export/export.service.js';
import { ImagesController } from './images/images.controller.js';
import { ImagesService } from './images/images.service.js';
import { LinksController } from './links/links.controller.js';
import { LinksService } from './links/links.service.js';
import { ManuscriptController } from './manuscript/manuscript.controller.js';
import { ManuscriptService } from './manuscript/manuscript.service.js';
import { NoteGroupsController, NotesController } from './notes/notes.controller.js';
import { NotesService } from './notes/notes.service.js';
import { ProjectController } from './project/project.controller.js';
import { ProjectService } from './project/project.service.js';
import { ProjectsController } from './project/projects.controller.js';
import { RecentProjectsService } from './project/recent-projects.service.js';
import { SearchController } from './search/search.controller.js';
import { SearchService } from './search/search.service.js';
import { AppSettingsController } from './settings/app-settings.controller.js';
import { AppSettingsService } from './settings/app-settings.service.js';
import { TagsController } from './tags/tags.controller.js';
import { TagsService } from './tags/tags.service.js';

@Module({})
export class AppModule {
  static forRoot(options: ServerOptions): DynamicModule {
    return {
      module: AppModule,
      controllers: [
        AppController,
        ProjectController,
        ProjectsController,
        ManuscriptController,
        NotesController,
        NoteGroupsController,
        LinksController,
        TagsController,
        AppSettingsController,
        ExportController,
        ImagesController,
        SearchController,
      ],
      providers: [
        { provide: SERVER_OPTIONS, useValue: options },
        ProjectService,
        RecentProjectsService,
        ManuscriptService,
        NotesService,
        LinksService,
        TagsService,
        AppSettingsService,
        ExportService,
        ImagesService,
        SearchService,
      ],
    };
  }
}
