import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import type { CreateMapRequest, MapSummary, PlaceMap, UpdateMapRequest } from '@wortomat/shared';
import { MapsService } from './maps.service.js';

@Controller()
export class MapsController {
  constructor(private readonly maps: MapsService) {}

  @Get('maps')
  list(): MapSummary[] {
    return this.maps.list();
  }

  @Post('maps')
  create(@Body() body: CreateMapRequest): PlaceMap {
    return this.maps.create(body);
  }

  @Get('maps/:id')
  get(@Param('id') id: string): PlaceMap {
    return this.maps.get(id);
  }

  @Patch('maps/:id')
  update(@Param('id') id: string, @Body() body: UpdateMapRequest): PlaceMap {
    return this.maps.update(id, body);
  }

  @Get('notes/:id/maps')
  containing(@Param('id') noteId: string): PlaceMap[] {
    return this.maps.containing(noteId);
  }

  @Delete('maps/:id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.maps.remove(id);
  }
}
