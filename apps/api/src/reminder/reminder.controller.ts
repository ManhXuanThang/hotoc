import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReminderService } from './reminder.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ReminderController {
  constructor(private reminders: ReminderService) {}

  @Get('families/:familyId/reminders')
  list(@Req() req: any, @Param('familyId') familyId: string, @Query('days') days = 60) {
    return this.reminders.listFamilyReminders(familyId, req.user.id, Number(days));
  }

  @Post('families/:familyId/reminders/sync')
  sync(@Req() req: any, @Param('familyId') familyId: string) {
    return this.reminders.syncDeathAnniversaries(familyId, req.user.id);
  }

  @Post('reminders/:id/sent')
  markSent(@Req() req: any, @Param('id') id: string) {
    return this.reminders.markSent(id, req.user.id);
  }
}
