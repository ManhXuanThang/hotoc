import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePersonDto, UpdatePersonDto, RelationType } from './person.dto';

@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePersonDto) {
    const member = await this.getMember(dto.familyId, userId);
    const isAdmin = ['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(member.role);

    if (!isAdmin) {
      return this.prisma.changeRequest.create({
        data: { familyId: dto.familyId, personId: 'PENDING_NEW',
          requestedById: userId, changeType: 'ADD_PERSON', fieldChanges: dto as any },
      });
    }

    const person = await this.prisma.person.create({
      data: {
        familyId: dto.familyId, fullName: dto.fullName,
        nickname: dto.nickname, gender: dto.gender ?? 'UNKNOWN',
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : null,
        isAlive: dto.isAlive ?? !dto.deathDate,
        hometown: dto.hometown, currentLocation: dto.currentLocation,
        occupation: dto.occupation, bio: dto.bio,
        isRootAncestor: dto.isRootAncestor ?? false,
        createdById: userId, approvedById: userId,
      },
    });

    if (dto.relatedPersonId && dto.relationToRelated) {
      await this.prisma.relationship.createMany({
        data: [
          { personId: person.id, relatedPersonId: dto.relatedPersonId, relationType: dto.relationToRelated },
          { personId: dto.relatedPersonId, relatedPersonId: person.id, relationType: dto.relationToRelated },
        ],
        skipDuplicates: true,
      });
    }

    if (person.deathDate) {
      const d = new Date(person.deathDate);
      const year = new Date().getFullYear();
      const reminderDate = new Date(year, d.getMonth(), d.getDate());
      if (reminderDate < new Date()) reminderDate.setFullYear(year + 1);
      await this.prisma.reminder.create({
        data: { familyId: dto.familyId, personId: person.id, type: 'DEATH_ANNIVERSARY', reminderDate },
      });
    }

    return person;
  }

  async findOne(personId: string, userId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id: personId, deletedAt: null },
      include: {
        relationsAsSource: { include: { relatedPerson: { select: { id: true, fullName: true, gender: true, birthDate: true, isAlive: true } } } },
        relationsAsTarget: { include: { person: { select: { id: true, fullName: true, gender: true, birthDate: true, isAlive: true } } } },
        photos: { where: { deletedAt: null }, take: 20 },
      },
    });
    if (!person) throw new NotFoundException('Thanh vien khong ton tai');
    return person;
  }

  async update(personId: string, userId: string, dto: UpdatePersonDto) {
    const person = await this.prisma.person.findFirst({ where: { id: personId, deletedAt: null } });
    if (!person) throw new NotFoundException('Thanh vien khong ton tai');
    const member = await this.getMember(person.familyId, userId);
    const isAdmin = ['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(member.role);
    const claim = await this.prisma.personClaim.findFirst({ where: { personId, userId, status: 'APPROVED' } });

    if (!isAdmin && !claim) {
      return this.prisma.changeRequest.create({
        data: { familyId: person.familyId, personId, requestedById: userId,
          changeType: 'UPDATE_PERSON', fieldChanges: dto as any },
      });
    }

    return this.prisma.person.update({
      where: { id: personId },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        deathDate: dto.deathDate ? new Date(dto.deathDate) : undefined,
      },
    });
  }

  async getFamilyTree(familyId: string, userId: string) {
    await this.getMember(familyId, userId);
    const persons = await this.prisma.person.findMany({
      where: { familyId, deletedAt: null },
      select: {
        id: true, fullName: true, nickname: true, gender: true,
        birthDate: true, deathDate: true, isAlive: true,
        currentLocation: true, generationNum: true, isRootAncestor: true, isVerified: true,
        relationsAsSource: { select: { relatedPersonId: true, relationType: true } },
        photos: { where: { deletedAt: null }, take: 1, select: { thumbnailUrl: true } },
        claims: { where: { status: 'APPROVED', userId }, select: { userId: true } },
      },
      orderBy: [{ generationNum: 'asc' }, { birthDate: 'asc' }],
    });

    return {
      totalPersons: persons.length,
      persons: persons.map(p => ({
        ...p,
        isCurrentUser: p.claims.length > 0,
        avatarUrl: p.photos[0]?.thumbnailUrl ?? null,
        claims: undefined, photos: undefined,
      })),
    };
  }

  private async getMember(familyId: string, userId: string) {
    const m = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!m) throw new ForbiddenException('Ban chua la thanh vien');
    return m;
  }
}
