import { Body, Controller, Get, Put } from '@nestjs/common';
import type { SaveStoryRequest, StoryMark, StoryState } from '@wortomat/shared';
import { StoryService } from './story.service.js';

@Controller()
export class StoryController {
  constructor(private readonly story: StoryService) {}

  /** The scenes' positions live on the nodes (`storyOrder`). */
  @Get('story/marks')
  marks(): StoryMark[] {
    return this.story.marks();
  }

  @Put('story')
  save(@Body() body: SaveStoryRequest): StoryState {
    return this.story.save(body);
  }
}
