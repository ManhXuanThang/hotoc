import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChangeRequestService {
  constructor(private prisma: PrismaService) {}

  async getPending(familyId: string, userId: string) {
    await this.checkAdmin(familyId, userId);
    return this.prisma.changeRequest.findMany({
      where: { familyId, status: 'PENDING' },
      include: { requestedBy: { select: { id: true, displayName: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(requestId: string, userId: string, action: 'APPROVE' | 'REJECT', note?: string) {
    const req = await this.prisma.changeRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Yeu cau khong ton tai');
    if (req.status !== 'PENDING') throw new BadRequestException('Yeu cau da duoc xu ly');
    await this.checkAdmin(req.familyId, userId);

    if (action === 'APPROVE' && req.changeType === 'UPDATE_PERSON') {
      const changes = req.fieldChanges as any;
      await this.prisma.person.update({
        where: { id: req.personId },
        data: {
          ...(changes.fullName && { fullName: changes.fullName }),
          ...(changes.currentLocation && { currentLocation: changes.currentLocation }),
          ...(changes.occupation && { occupation: changes.occupation }),
          ...(changes.bio && { bio: changes.bio }),
        },
      });
    }

    return this.prisma.changeRequest.update({
      where: { id: requestId },
      data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewedById: userId, reviewNote: note },
    });
  }

  private async checkAdmin(familyId: string, userId: string) {
    const m = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!m || !['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(m.role)) {
      throw new ForbiddenException('Chi Admin moi co quyen duyet');
    }
  }
}
