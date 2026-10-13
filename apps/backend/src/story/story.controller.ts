import { Body, Controller, Get, Put } from '@nestjs/common';
import type { SaveStoryRequest, StoryMark, StoryState } from '@wortomat/shared';
import { StoryService } from './story.service.js';

@Controller()
export class StoryController {
  constructor(private readonly story: StoryService) {}

  /** Die Positionen der Szenen stehen an den Knoten (`storyOrder`). */
  @Get('story/marks')
  marks(): StoryMark[] {
    return this.story.marks();
  }

  /** Ersetzt die ganze Reihenfolge der Handlung samt Marken. */
  @Put('story')
  save(@Body() body: SaveStoryRequest): StoryState {
    return this.story.save(body);
  }
}
