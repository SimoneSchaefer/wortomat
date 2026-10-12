import { type DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { SERVER_OPTIONS, type ServerOptions } from './config.js';
import { ImagesController } from './images/images.controller.js';
import { ImagesService } from './images/images.service.js';
import { ManuscriptController } from './manuscript/manuscript.controller.js';
import { ManuscriptService } from './manuscript/manuscript.service.js';
import { ProjectController } from './project/project.controller.js';
import { ProjectService } from './project/project.service.js';
import { ProjectsController } from './project/projects.controller.js';
import { RecentProjectsService } from './project/recent-projects.service.js';
import { SearchController } from './search/search.controller.js';
import { SearchService } from './search/search.service.js';

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
        ImagesController,
        SearchController,
      ],
      providers: [
        { provide: SERVER_OPTIONS, useValue: options },
        ProjectService,
        RecentProjectsService,
        ManuscriptService,
        ImagesService,
        SearchService,
      ],
    };
  }
}
