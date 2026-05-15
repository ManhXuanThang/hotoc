import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { OtpService } from './otp.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otp: OtpService,
  ) {}

  // Gửi OTP — rate limit 5 lần/ngày/số xử lý ở controller
  async sendOtp(phone: string): Promise<{ message: string }> {
    const code = this.otp.generate();
    await this.otp.store(phone, code);         // Lưu vào Redis, TTL 5 phút
    await this.otp.send(phone, code);          // Gọi Speedsms API
    return { message: 'OTP đã được gửi' };
  }

  // Xác minh OTP và trả về tokens
  async verifyOtp(phone: string, code: string) {
    const valid = await this.otp.verify(phone, code);
    if (!valid) throw new BadRequestException('OTP không đúng hoặc đã hết hạn');

    // Tạo hoặc lấy UserAccount
    let user = await this.prisma.userAccount.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.userAccount.create({
        data: { phone },
      });
    }

    return this.generateTokens(user.id, user.phone);
  }

  // Refresh token
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.userAccount.findUnique({
        where: { id: payload.sub },
      });
      if (!user || !user.refreshToken) throw new UnauthorizedException();

      const valid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!valid) throw new UnauthorizedException();

      return this.generateTokens(user.id, user.phone);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
  }

  private async generateTokens(userId: string, phone: string) {
    const payload = { sub: userId, phone };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    // Lưu hashed refresh token vào DB
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: { refreshToken: hashed, lastLoginAt: new Date() },
    });

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    await this.prisma.userAccount.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Đăng xuất thành công' };
  }

  async me(userId: string) {
    return this.prisma.userAccount.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        familyMembers: {
          select: {
            role: true,
            joinedAt: true,
            family: {
              select: {
                id: true,
                name: true,
                originProvince: true,
                originDistrict: true,
                _count: { select: { persons: { where: { deletedAt: null } } } },
              },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
        claims: {
          where: { status: 'APPROVED' },
          select: {
            familyId: true,
            person: {
              select: {
                id: true,
                familyId: true,
                fullName: true,
                birthDate: true,
                currentLocation: true,
                occupation: true,
                bio: true,
                generationNum: true,
              },
            },
          },
        },
      },
    });
  }

  async updateMe(userId: string, dto: { displayName?: string; avatarUrl?: string }) {
    return this.prisma.userAccount.update({
      where: { id: userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName.trim() || null }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl.trim() || null }),
      },
      select: { id: true, phone: true, displayName: true, avatarUrl: true },
    });
  }
}
