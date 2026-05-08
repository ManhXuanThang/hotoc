import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PersonService } from './person.service';
import { CreatePersonDto, UpdatePersonDto } from './person.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class PersonController {
  constructor(private person: PersonService) {}

  @Post('persons') create(@Req() req: any, @Body() dto: CreatePersonDto) {
    return this.person.create(req.user.id, dto);
  }
  @Get('persons/:id') findOne(@Req() req: any, @Param('id') id: string) {
    return this.person.findOne(id, req.user.id);
  }
  @Patch('persons/:id') update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.person.update(id, req.user.id, dto);
  }
  @Get('families/:familyId/tree') getTree(@Req() req: any, @Param('familyId') familyId: string) {
    return this.person.getFamilyTree(familyId, req.user.id);
  }
}
