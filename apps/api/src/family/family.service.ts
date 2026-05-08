import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFamilyDto, UpdateFamilyDto } from './family.dto';

function nanoid(n: number) {
  return Math.random().toString(36).substring(2, 2+n).toUpperCase();
}

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFamilyDto) {
    const family = await this.prisma.family.create({
      data: {
        name: dto.name,
        originProvince: dto.originProvince,
        originDistrict: dto.originDistrict,
        originCommune: dto.originCommune,
        description: dto.description,
        visibility: dto.visibility ?? 'PRIVATE',
        createdById: userId,
        inviteCode: nanoid(8),
        inviteExpiresAt: new Date(Date.now() + 30 * 86400000),
      },
    });
    await this.prisma.familyMember.create({
      data: { familyId: family.id, userId, role: 'SUPER_ADMIN' },
    });
    return family;
  }

  async findOne(familyId: string, userId?: string) {
    const family = await this.prisma.family.findFirst({
      where: { id: familyId, deletedAt: null },
      include: { _count: { select: { persons: { where: { deletedAt: null } } } } },
    });
    if (!family) throw new NotFoundException('Dong ho khong ton tai');
    return family;
  }

  async getUserFamilies(userId: string) {
    return this.prisma.family.findMany({
      where: { deletedAt: null, familyMembers: { some: { userId } } },
      include: {
        _count: { select: { persons: { where: { deletedAt: null } } } },
        familyMembers: { where: { userId }, select: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(familyId: string, userId: string, dto: UpdateFamilyDto) {
    await this.checkAdmin(familyId, userId);
    return this.prisma.family.update({ where: { id: familyId }, data: dto });
  }

  async regenerateInviteCode(familyId: string, userId: string, expireDays = 30) {
    await this.checkAdmin(familyId, userId);
    return this.prisma.family.update({
      where: { id: familyId },
      data: {
        inviteCode: nanoid(8),
        inviteExpiresAt: expireDays === 0 ? null : new Date(Date.now() + expireDays * 86400000),
      },
      select: { inviteCode: true, inviteExpiresAt: true },
    });
  }

  async joinByInviteCode(code: string, userId: string) {
    const family = await this.prisma.family.findFirst({
      where: { inviteCode: code.toUpperCase(), deletedAt: null,
        OR: [{ inviteExpiresAt: null }, { inviteExpiresAt: { gt: new Date() } }] },
    });
    if (!family) throw new NotFoundException('Link moi khong hop le hoac da het han');
    const existing = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId: family.id, userId } },
    });
    if (existing) throw new ConflictException('Ban da la thanh vien');
    await this.prisma.familyMember.create({
      data: { familyId: family.id, userId, role: 'VIEWER' },
    });
    return { familyId: family.id, familyName: family.name };
  }

  private async checkAdmin(familyId: string, userId: string) {
    const m = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!m || !['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(m.role)) {
      throw new ForbiddenException('Ban khong co quyen');
    }
  }
}
