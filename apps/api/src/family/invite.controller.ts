import { Controller, Get, Param } from '@nestjs/common';
import { FamilyService } from './family.service';

@Controller('families/invite')
export class InviteController {
  constructor(private family: FamilyService) {}

  @Get(':code')
  preview(@Param('code') code: string) {
    return this.family.getInvitePreview(code);
  }
}
