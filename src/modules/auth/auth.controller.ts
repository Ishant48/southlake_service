import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResolveChallengeDto } from './dto/resolve-challenge.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserSession } from './entities/user-session.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 1: Verify email and password, then receive OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent to email' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Too many OTP requests' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    return this.authService.login(dto, ipAddress);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and receive session token or challenge' })
  @ApiResponse({ status: 200, description: 'Returns session token or challenge token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.verifyOtp(dto, ipAddress, userAgent);
  }

  @Public()
  @Post('resolve-challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept or reject a session conflict challenge' })
  @ApiResponse({ status: 200, description: 'Challenge resolved' })
  @ApiResponse({ status: 404, description: 'Challenge not found or expired' })
  resolveChallenge(@Body() dto: ResolveChallengeDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    const userAgent = req.headers['user-agent'] || '';
    return this.authService.resolveChallenge(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Req() req: Request & { session: UserSession }) {
    return this.authService.logout(req.session);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user with role and permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: User) {
    return this.authService.getMe(user);
  }

  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    return forwarded?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  }
}
