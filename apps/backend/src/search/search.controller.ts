import { Controller, Get, Query } from '@nestjs/common';
import type { SearchHit } from '@wortomat/shared';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') q = ''): SearchHit[] {
    return this.searchService.search(q);
  }
}
