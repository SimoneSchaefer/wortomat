import { type DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ArcsController } from './arcs/arcs.controller.js';
import { ArcsService } from './arcs/arcs.service.js';
import { SERVER_OPTIONS, type ServerOptions } from './config.js';
import { ExportController } from './export/export.controller.js';
import { ExportService } from './export/export.service.js';
import { FilesController } from './files/files.controller.js';
import { ImagesController } from './images/images.controller.js';
import { ImagesService } from './images/images.service.js';
import { LinksController } from './links/links.controller.js';
import { LinksService } from './links/links.service.js';
import { MapsController } from './maps/maps.controller.js';
import { MapsService } from './maps/maps.service.js';
import { ManuscriptController } from './manuscript/manuscript.controller.js';
import { ManuscriptService } from './manuscript/manuscript.service.js';
import { NoteGroupsController, NotesController } from './notes/notes.controller.js';
import { NotesService } from './notes/notes.service.js';
import { ProjectController } from './project/project.controller.js';
import { ProjectService } from './project/project.service.js';
import { ProjectsController } from './project/projects.controller.js';
import { RecentProjectsService } from './project/recent-projects.service.js';
import { ProofreadingController } from './proofreading/proofreading.controller.js';
import { ProofreadingService } from './proofreading/proofreading.service.js';
import { SearchController } from './search/search.controller.js';
import { SearchService } from './search/search.service.js';
import { AppSettingsController } from './settings/app-settings.controller.js';
import { AppSettingsService } from './settings/app-settings.service.js';
import { StoryController } from './story/story.controller.js';
import { StoryService } from './story/story.service.js';
import { StrandsController } from './strands/strands.controller.js';
import { StrandsService } from './strands/strands.service.js';
import { TagsController } from './tags/tags.controller.js';
import { TagsService } from './tags/tags.service.js';
import { TrashController } from './trash/trash.controller.js';
import { TrashService } from './trash/trash.service.js';
import { WritingLogController } from './writing-log/writing-log.controller.js';
import { WritingLogService } from './writing-log/writing-log.service.js';

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
        ArcsController,
        MapsController,
        TagsController,
        TrashController,
        StrandsController,
        StoryController,
        ProofreadingController,
        AppSettingsController,
        ExportController,
        FilesController,
        ImagesController,
        SearchController,
        WritingLogController,
      ],
      providers: [
        { provide: SERVER_OPTIONS, useValue: options },
        ProjectService,
        RecentProjectsService,
        ManuscriptService,
        NotesService,
        LinksService,
        ArcsService,
        MapsService,
        TagsService,
        TrashService,
        StrandsService,
        StoryService,
        ProofreadingService,
        AppSettingsService,
        ExportService,
        ImagesService,
        SearchService,
        WritingLogService,
      ],
    };
  }
}
