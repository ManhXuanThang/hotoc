import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChangeRequestService {
  constructor(private prisma: PrismaService) {}

  async getPending(familyId: string, userId: string) {
    await this.checkAdmin(familyId, userId);
    return this.prisma.changeRequest.findMany({
      where: { familyId, status: 'PENDING' },
      include: {
        person: { select: { id: true, fullName: true, gender: true, birthDate: true, deathDate: true, currentLocation: true, deletedAt: true } },
        requestedBy: { select: { id: true, displayName: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async review(requestId: string, userId: string, action: 'APPROVE' | 'REJECT', note?: string) {
    const req = await this.prisma.changeRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Yeu cau khong ton tai');
    if (req.status !== 'PENDING') throw new BadRequestException('Yeu cau da duoc xu ly');
    await this.checkAdmin(req.familyId, userId);

    if (action === 'APPROVE' && req.changeType === 'ADD_PERSON') {
      const changes = req.fieldChanges as any;
      await this.prisma.person.update({
        where: { id: req.personId },
        data: {
          ...this.personDataFromChanges(changes),
          deletedAt: null,
          approvedById: userId,
          isVerified: true,
        },
      });
      if (changes.relatedPersonId && changes.relationToRelated) {
        await this.prisma.relationship.createMany({
          data: [
            { personId: req.personId, relatedPersonId: changes.relatedPersonId, relationType: changes.relationToRelated },
            { personId: changes.relatedPersonId, relatedPersonId: req.personId, relationType: changes.relationToRelated },
          ],
          skipDuplicates: true,
        });
      }
      if (changes.deathDate) {
        const d = new Date(changes.deathDate);
        const year = new Date().getFullYear();
        const reminderDate = new Date(year, d.getMonth(), d.getDate());
        if (reminderDate < new Date()) reminderDate.setFullYear(year + 1);
        await this.prisma.reminder.create({
          data: { familyId: req.familyId, personId: req.personId, type: 'DEATH_ANNIVERSARY', reminderDate },
        });
      }
    }

    if (action === 'APPROVE' && req.changeType === 'UPDATE_PERSON') {
      const changes = req.fieldChanges as any;
      await this.prisma.person.update({
        where: { id: req.personId },
        data: this.personDataFromChanges(changes),
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

  private personDataFromChanges(changes: any) {
    return {
      ...(changes.fullName && { fullName: changes.fullName }),
      ...(changes.nickname && { nickname: changes.nickname }),
      ...(changes.gender && { gender: changes.gender }),
      ...(changes.birthDate && { birthDate: new Date(changes.birthDate) }),
      ...(changes.deathDate && { deathDate: new Date(changes.deathDate) }),
      ...(typeof changes.isAlive === 'boolean' && { isAlive: changes.isAlive }),
      ...(changes.hometown && { hometown: changes.hometown }),
      ...(changes.currentLocation && { currentLocation: changes.currentLocation }),
      ...(changes.occupation && { occupation: changes.occupation }),
      ...(changes.bio && { bio: changes.bio }),
      ...(typeof changes.isRootAncestor === 'boolean' && { isRootAncestor: changes.isRootAncestor }),
    };
  }
}
