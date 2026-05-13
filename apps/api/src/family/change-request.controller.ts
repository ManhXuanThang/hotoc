import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangeRequestService } from './change-request.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ChangeRequestController {
  constructor(private changeRequests: ChangeRequestService) {}

  @Get('families/:familyId/change-requests')
  getPending(@Req() req: any, @Param('familyId') familyId: string) {
    return this.changeRequests.getPending(familyId, req.user.id);
  }

  @Post('change-requests/:id/review')
  review(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; note?: string },
  ) {
    return this.changeRequests.review(id, req.user.id, body.action, body.note);
  }
}
