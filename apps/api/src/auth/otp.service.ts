import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class OtpService {
  private redis: Redis;
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_TTL = 300;
  private readonly MAX_PER_DAY = 5;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.redis = new Redis(redisUrl);
  }

  generate(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async store(phone: string, code: string): Promise<void> {
    const dayKey = `otp:count:${phone}:${new Date().toISOString().slice(0, 10)}`;
    const count = await this.redis.incr(dayKey);
    if (count === 1) await this.redis.expire(dayKey, 86400);
    if (count > this.MAX_PER_DAY) throw new Error('Qua so lan gui OTP trong ngay');
    await this.redis.setex(`otp:${phone}`, this.OTP_TTL, code);
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`otp:${phone}`);
    if (!stored || stored !== code) return false;
    await this.redis.del(`otp:${phone}`);
    return true;
  }

  async send(phone: string, code: string): Promise<void> {
    this.logger.log(`[DEV] OTP cho ${phone}: ${code}`);
  }
}
