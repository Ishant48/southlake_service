import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResolveChallengeDto } from './dto/resolve-challenge.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { UserSession } from './entities/user-session.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and receive session token or challenge' })
  @ApiResponse({ status: 200, description: 'Returns session token or challenge token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    const userAgent = req.headers['user-agent'] ?? '';
    return this.authService.verifyOtp(dto, ipAddress, userAgent);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('resolve-challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept or reject a session conflict challenge' })
  @ApiResponse({ status: 200, description: 'Challenge resolved' })
  @ApiResponse({ status: 404, description: 'Challenge not found or expired' })
  resolveChallenge(@Body() dto: ResolveChallengeDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    const userAgent = req.headers['user-agent'] ?? '';
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

  @Public()
  @Get('invite-details')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify invite token and return name & email' })
  @ApiResponse({ status: 200, description: 'Token verified successfully' })
  @ApiResponse({ status: 404, description: 'Invalid token' })
  getInviteDetails(@Query('token') token: string) {
    return this.authService.getInviteDetails(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invitation and set password' })
  @ApiResponse({ status: 200, description: 'Invitation accepted and account created' })
  @ApiResponse({ status: 400, description: 'Invalid request or token' })
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  @ApiResponse({ status: 200, description: 'Generic response, regardless of whether email exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    return this.authService.forgotPassword(dto, ipAddress);
  }

  @Public()
  @Get('reset-password/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a password reset token is valid' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 404, description: 'Invalid, expired, or already-used token' })
  validateResetToken(@Query('token') token: string) {
    return this.authService.validateResetToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 404, description: 'Invalid, expired, or already-used token' })
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ipAddress = this.getIpAddress(req);
    return this.authService.resetPassword(dto, ipAddress);
  }

  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    return forwarded?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
