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
    await this.prisma.auditLog.create({
      data: {
        familyId: family.id,
        entityType: 'Family',
        entityId: family.id,
        action: 'CREATE',
        newValue: { name: family.name },
        performedById: userId,
      },
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

  async getInvitePreview(code: string) {
    const family = await this.prisma.family.findFirst({
      where: {
        inviteCode: code.toUpperCase(),
        deletedAt: null,
        OR: [{ inviteExpiresAt: null }, { inviteExpiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        name: true,
        originProvince: true,
        originDistrict: true,
        originCommune: true,
        description: true,
        avatarUrl: true,
        _count: { select: { persons: { where: { deletedAt: null } } } },
      },
    });
    if (!family) throw new NotFoundException('Link moi khong hop le hoac da het han');
    return family;
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
    await this.prisma.auditLog.create({
      data: {
        familyId: family.id,
        entityType: 'FamilyMember',
        entityId: userId,
        action: 'CREATE',
        newValue: { userId, role: 'VIEWER' },
        performedById: userId,
      },
    });
    return { familyId: family.id, familyName: family.name };
  }

  async about(familyId: string, userId: string) {
    await this.getMember(familyId, userId);
    const family = await this.prisma.family.findFirst({
      where: { id: familyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        originProvince: true,
        originDistrict: true,
        originCommune: true,
        description: true,
        visibility: true,
        inviteCode: true,
        persons: {
          where: { deletedAt: null },
          select: { id: true, isAlive: true, generationNum: true, currentLocation: true, birthDate: true },
        },
      },
    });
    if (!family) throw new NotFoundException('Dong ho khong ton tai');
    const locations = new Map<string, number>();
    for (const person of family.persons) {
      if (!person.currentLocation) continue;
      const key = person.currentLocation.split(',')[0].trim();
      locations.set(key, (locations.get(key) ?? 0) + 1);
    }
    const generations = family.persons.map((p) => p.generationNum).filter((n): n is number => typeof n === 'number');
    return {
      ...family,
      stats: {
        totalMembers: family.persons.length,
        generations: new Set(generations).size,
        living: family.persons.filter((p) => p.isAlive).length,
        passed: family.persons.filter((p) => !p.isAlive).length,
        firstGeneration: generations.length ? Math.min(...generations) : null,
        latestGeneration: generations.length ? Math.max(...generations) : null,
      },
      locations: [...locations.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      persons: undefined,
    };
  }

  async activity(familyId: string, userId: string) {
    await this.getMember(familyId, userId);
    return this.prisma.auditLog.findMany({
      where: { familyId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: {
        id: true,
        entityType: true,
        entityId: true,
        action: true,
        newValue: true,
        createdAt: true,
        performedBy: { select: { displayName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async export(familyId: string, userId: string, format: 'json' | 'csv' = 'json') {
    await this.checkAdmin(familyId, userId);
    const family = await this.prisma.family.findFirst({
      where: { id: familyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        originProvince: true,
        originDistrict: true,
        originCommune: true,
        description: true,
        persons: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            gender: true,
            birthDate: true,
            deathDate: true,
            isAlive: true,
            hometown: true,
            currentLocation: true,
            occupation: true,
            bio: true,
            generationNum: true,
            isRootAncestor: true,
          },
        },
      },
    });
    if (!family) throw new NotFoundException('Dong ho khong ton tai');
    const relationships = await this.prisma.relationship.findMany({
      where: { person: { familyId, deletedAt: null }, relatedPerson: { familyId, deletedAt: null } },
      select: { personId: true, relatedPersonId: true, relationType: true },
    });
    if (format === 'csv') {
      const header = 'id,fullName,gender,birthDate,deathDate,isAlive,hometown,currentLocation,occupation,generationNum,isRootAncestor';
      const rows = family.persons.map((p) => [
        p.id,
        p.fullName,
        p.gender,
        p.birthDate?.toISOString() ?? '',
        p.deathDate?.toISOString() ?? '',
        p.isAlive,
        p.hometown ?? '',
        p.currentLocation ?? '',
        p.occupation ?? '',
        p.generationNum ?? '',
        p.isRootAncestor,
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
      return { fileName: `${family.name}.csv`, contentType: 'text/csv', content: [header, ...rows].join('\n') };
    }
    return { family, relationships, exportedAt: new Date().toISOString(), sensitiveFieldsExcluded: ['phone', 'address'] };
  }

  private async checkAdmin(familyId: string, userId: string) {
    const m = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!m || !['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(m.role)) {
      throw new ForbiddenException('Ban khong co quyen');
    }
  }

  private async getMember(familyId: string, userId: string) {
    const m = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!m) throw new ForbiddenException('Ban chua la thanh vien');
    return m;
  }
}
