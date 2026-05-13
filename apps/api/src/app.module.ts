import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { FamilyModule } from './family/family.module';
import { PersonModule } from './person/person.module';
import { ReminderModule } from './reminder/reminder.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    // Config — load .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting — chống spam OTP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),

    // Cron jobs — nhắc giỗ
    ScheduleModule.forRoot(),

    // Feature modules
    PrismaModule,
    AuthModule,
    FamilyModule,
    PersonModule,
    ReminderModule,
  ],
})
export class AppModule {}
