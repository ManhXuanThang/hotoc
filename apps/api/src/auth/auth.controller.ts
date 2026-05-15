import { Controller, Post, Body, UseGuards, Req, HttpCode, Get, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IsOptional, IsPhoneNumber, IsString, Length, MaxLength } from 'class-validator';

class SendOtpDto {
  @IsPhoneNumber('VN')
  phone: string;
}

class VerifyOtpDto {
  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

class RefreshDto {
  @IsString()
  refreshToken: string;
}

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // Giới hạn 3 lần gửi OTP/phút/IP
  @Post('send-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.auth.sendOtp(dto.phone);
  }

  @Post('verify-otp')
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout(@Req() req: any) {
    return this.auth.logout(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return this.auth.me(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return this.auth.updateMe(req.user.id, dto);
  }
}
