import { Module } from '@nestjs/common';
import { FamilyController } from './family.controller';
import { InviteController } from './invite.controller';
import { ChangeRequestController } from './change-request.controller';
import { FamilyService } from './family.service';
import { ChangeRequestService } from './change-request.service';

@Module({
  controllers: [FamilyController, InviteController, ChangeRequestController],
  providers: [FamilyService, ChangeRequestService],
  exports: [FamilyService],
})
export class FamilyModule {}
