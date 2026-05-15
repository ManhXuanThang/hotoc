import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FamilyService } from './family.service';
import { CreateFamilyDto, UpdateFamilyDto } from './family.dto';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamilyController {
  constructor(private family: FamilyService) {}

  @Post() create(@Req() req: any, @Body() dto: CreateFamilyDto) {
    return this.family.create(req.user.id, dto);
  }
  @Get('me') getMyFamilies(@Req() req: any) {
    return this.family.getUserFamilies(req.user.id);
  }
  @Get(':id') findOne(@Req() req: any, @Param('id') id: string) {
    return this.family.findOne(id, req.user?.id);
  }
  @Get(':id/about') about(@Req() req: any, @Param('id') id: string) {
    return this.family.about(id, req.user.id);
  }
  @Get(':id/activity')
  activity(@Req() req: any, @Param('id') id: string) {
    return this.family.activity(id, req.user.id);
  }
  @Get(':id/export')
  export(@Req() req: any, @Param('id') id: string, @Query('format') format: 'json' | 'csv' = 'json') {
    return this.family.export(id, req.user.id, format);
  }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateFamilyDto) {
    return this.family.update(id, req.user.id, dto);
  }
  @Post(':id/invite/regenerate') regenerate(@Req() req: any, @Param('id') id: string, @Query('days') days = 30) {
    return this.family.regenerateInviteCode(id, req.user.id, +days);
  }
  @Post('join/:code') join(@Req() req: any, @Param('code') code: string) {
    return this.family.joinByInviteCode(code, req.user.id);
  }
}
