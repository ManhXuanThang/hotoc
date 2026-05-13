import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReminderType } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ReminderService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async listFamilyReminders(familyId: string, userId: string, days = 60) {
    await this.getMember(familyId, userId);
    const until = new Date();
    until.setDate(until.getDate() + days);

    return this.prisma.reminder.findMany({
      where: {
        familyId,
        reminderDate: { lte: until },
      },
      include: {
        person: { select: { id: true, fullName: true, deathDate: true, birthDate: true, gender: true } },
      },
      orderBy: { reminderDate: 'asc' },
    });
  }

  async syncDeathAnniversaries(familyId: string, userId: string) {
    await this.checkAdmin(familyId, userId);
    const persons = await this.prisma.person.findMany({
      where: { familyId, deletedAt: null, deathDate: { not: null } },
      select: { id: true, deathDate: true },
    });

    const year = new Date().getFullYear();
    for (const person of persons) {
      if (!person.deathDate) continue;
      const d = new Date(person.deathDate);
      const reminderDate = new Date(year, d.getMonth(), d.getDate());
      if (reminderDate < new Date()) reminderDate.setFullYear(year + 1);

      const existing = await this.prisma.reminder.findFirst({
        where: {
          familyId,
          personId: person.id,
          type: ReminderType.DEATH_ANNIVERSARY,
          reminderDate,
        },
      });
      if (!existing) {
        await this.prisma.reminder.create({
          data: { familyId, personId: person.id, type: ReminderType.DEATH_ANNIVERSARY, reminderDate },
        });
      }
    }

    return this.listFamilyReminders(familyId, userId);
  }

  async markSent(id: string, userId: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (!reminder) return null;
    await this.checkAdmin(reminder.familyId, userId);
    return this.prisma.reminder.update({
      where: { id },
      data: { isSent: true, sentAt: new Date() },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processDueReminders() {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const reminders = await this.prisma.reminder.findMany({
      where: { isSent: false, reminderDate: { lte: endOfToday } },
      include: {
        person: { select: { fullName: true } },
        family: {
          select: {
            id: true,
            name: true,
            familyMembers: {
              where: { role: { in: ['SUPER_ADMIN', 'BRANCH_ADMIN'] } },
              include: { user: { select: { phone: true, displayName: true } } },
            },
          },
        },
      },
      take: 50,
    });

    const webhookUrl = this.config.get<string>('NOTIFICATION_WEBHOOK_URL');
    for (const reminder of reminders) {
      const payload = {
        type: 'DEATH_ANNIVERSARY',
        familyId: reminder.familyId,
        familyName: reminder.family.name,
        personName: reminder.person.fullName,
        reminderDate: reminder.reminderDate,
        recipients: reminder.family.familyMembers.map((member) => ({
          phone: member.user.phone,
          name: member.user.displayName,
        })),
      };

      if (!webhookUrl) {
        console.log('[REMINDER_DRY_RUN]', payload);
        continue;
      }

      await axios.post(webhookUrl, payload);
      await this.prisma.reminder.update({
        where: { id: reminder.id },
        data: { isSent: true, sentAt: new Date() },
      });
    }

    return { processed: reminders.length, sent: webhookUrl ? reminders.length : 0 };
  }

  private async getMember(familyId: string, userId: string) {
    const m = await this.prisma.familyMember.findUnique({
      where: { familyId_userId: { familyId, userId } },
    });
    if (!m) throw new ForbiddenException('Bạn chưa là thành viên');
    return m;
  }

  private async checkAdmin(familyId: string, userId: string) {
    const m = await this.getMember(familyId, userId);
    if (!['SUPER_ADMIN', 'BRANCH_ADMIN'].includes(m.role)) {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền thực hiện');
    }
  }
}
