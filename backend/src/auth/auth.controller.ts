import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Req } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from './types/jwt-payload.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { RegisterCollegeDto } from './dto/register-college.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Post('register/member')
  registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  /** @deprecated Use register/member. Kept so existing member-app builds keep working. */
  @Public()
  @Post('register/student')
  async registerStudent(@Body() dto: RegisterStudentDto) {
    let joinCode: string | undefined;
    if (dto.collegeId) {
      const org = await this.prisma.bypassRls(() =>
        this.prisma.organization.findUnique({ where: { id: dto.collegeId } }),
      );
      joinCode = org?.joinCode;
    }
    return this.authService.registerMember({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      joinCode,
      mobile: dto.mobile,
    });
  }

  @Public()
  @Post('register/organization')
  registerOrganization(@Body() dto: RegisterOrganizationDto) {
    return this.authService.registerOrganization(dto);
  }

  /** @deprecated Use register/organization. */
  @Public()
  @Post('register/college')
  registerCollegeLegacy(@Body() dto: RegisterCollegeDto) {
    return this.authService.registerOrganization({
      organizationName: dto.collegeName,
      organizationCode: dto.collegeCode,
      state: dto.state,
      district: dto.district,
      contactName: dto.principal,
      phone: dto.phone,
      organizationEmail: dto.collegeEmail,
      address: dto.address,
      ownerName: dto.adminName,
      ownerEmail: dto.adminEmail,
      ownerPassword: dto.adminPassword,
      ownerPhone: dto.adminPhone,
    });
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Patch('change-password')
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('support/organizations/:id/enter')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'SUPPORT_ORG_ACCESS', entityType: 'Organization' })
  enterOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { ip?: string },
  ) {
    return this.authService.enterOrganizationAsSupport(user.id, id, req.ip);
  }

  @Post('support/leave-organization')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'SUPPORT_ORG_LEAVE', entityType: 'Organization' })
  leaveOrganization(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.leaveOrganizationAsSupport(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, body);
  }
}
