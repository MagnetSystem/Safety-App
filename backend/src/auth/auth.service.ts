import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';
import type { JwtPayload } from './types/jwt-payload.interface';
import { generateJoinCode, slugCodeFromName } from '../common/codes';
import { OrganizationTypesService } from '../organization-types/organization-types.service';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mail: MailService,
    private readonly orgTypes: OrganizationTypesService,
  ) {}

  async registerMember(dto: RegisterMemberDto) {
    return this.prisma.bypassRls(async () => {
      let organizationId: string | null = null;
      if (dto.joinCode) {
        const organization = await this.prisma.organization.findUnique({
          where: { joinCode: dto.joinCode.trim().toUpperCase() },
        });
        if (!organization || organization.status !== 'ACTIVE') {
          throw new BadRequestException('Join code is invalid or the organization is not active');
        }
        organizationId = organization.id;
      }

      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('An account with this email already exists');

      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: UserRole.MEMBER,
          member: {
            create: {
              name: dto.name,
              organizationId,
              mobile: dto.mobile,
            },
          },
        },
      });

      return this.issueTokens(user.id, user.email, user.role, organizationId);
    });
  }

  async registerOrganization(dto: RegisterOrganizationDto) {
    return this.prisma.bypassRls(async () => {
      const industry = (dto.industry ?? 'EDUCATION').toUpperCase();
      const catalog = await this.orgTypes.resolve(industry);
      const typeRow = await this.orgTypes.findTypeRow(industry);
      const settings = await this.orgTypes.settingsForSlug(industry);
      const code = dto.organizationCode?.trim() || slugCodeFromName(dto.organizationName);
      const existingOrg = await this.prisma.organization.findUnique({ where: { code } });
      if (existingOrg) throw new ConflictException('An organization with this code already exists');

      const existingUser = await this.prisma.user.findUnique({ where: { email: dto.ownerEmail } });
      if (existingUser) throw new ConflictException('An account with this email already exists');

      const passwordHash = await bcrypt.hash(dto.ownerPassword, BCRYPT_ROUNDS);
      const joinCode = await this.uniqueJoinCode();

      const result = await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: dto.organizationName,
            code,
            joinCode,
            industry: catalog.id,
            organizationTypeId: typeRow?.id,
            state: dto.state,
            district: dto.district,
            contactName: dto.contactName,
            phone: dto.phone,
            email: dto.organizationEmail,
            address: dto.address,
            settings: settings as unknown as Prisma.InputJsonValue,
            status: 'ACTIVE',
          },
        });

        const user = await tx.user.create({
          data: {
            email: dto.ownerEmail,
            passwordHash,
            role: UserRole.OWNER,
            orgStaff: {
              create: {
                name: dto.ownerName,
                phone: dto.ownerPhone,
                organizationId: organization.id,
                orgRole: 'OWNER',
              },
            },
          },
        });

        return { organization, user };
      });

      const templates = catalog.defaultDepartments;
      if (templates.length > 0) {
        await this.prisma.department.createMany({
          data: templates.map((t, i) => ({
            organizationId: result.organization.id,
            name: t.name,
            slug: t.slug,
            description: t.description,
            isDefault: i === 0,
          })),
        });
      }

      return this.issueTokens(
        result.user.id,
        result.user.email,
        result.user.role,
        result.organization.id,
      );
    });
  }

  async login(dto: LoginDto) {
    return this.prisma.bypassRls(async () => {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { member: true, orgStaff: true },
      });
      if (!user) throw new UnauthorizedException('Invalid email or password');

      const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordValid) throw new UnauthorizedException('Invalid email or password');
      if (!user.isActive) throw new UnauthorizedException('This account has been deactivated');

      const organizationId = user.member?.organizationId ?? user.orgStaff?.organizationId ?? null;
      if (organizationId) {
        const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization || organization.status !== 'ACTIVE') {
          throw new UnauthorizedException('This organization account has been suspended');
        }
      }

      return this.issueTokens(user.id, user.email, user.role, organizationId);
    });
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.bypassRls(() => this.prisma.user.findUnique({ where: { id: payload.sub } }));
    if (!user || !user.isActive) throw new UnauthorizedException('Account no longer active');

    const organizationId = payload.organizationId ?? payload.collegeId ?? null;
    return this.issueTokens(user.id, user.email, user.role, organizationId);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.bypassRls(() => this.prisma.user.findUnique({ where: { email: dto.email } }));
    if (user && user.isActive) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const link = this.buildResetLink(user.role, rawToken);
      await this.mail.send(
        user.email,
        'Reset your Safety Platform password',
        `We received a request to reset your password.\n\nOpen this link to choose a new one (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      );
    }
    return { message: 'If that email has an account, a reset link is on its way.' };
  }

  private buildResetLink(role: JwtPayload['role'], token: string): string {
    if (role === UserRole.MEMBER || role === UserRole.GUARDIAN) {
      const scheme = this.configService.get<string>('STUDENT_APP_SCHEME') ?? 'studentapp';
      return `${scheme}://reset-password?token=${token}`;
    }
    const base = this.configService.get<string>('ADMIN_PORTAL_URL') ?? '';
    return `${base}/reset-password?token=${token}`;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const record = await this.prisma.bypassRls(() =>
      this.prisma.passwordResetToken.findUnique({ where: { tokenHash } }),
    );

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId, usedAt: null, id: { not: record.id } },
      }),
    ]);

    return { message: 'Your password has been updated. You can now sign in.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        member: { include: { organization: { select: { id: true, name: true, code: true, industry: true, joinCode: false, settings: true } } } },
        orgStaff: { include: { organization: true } },
        guardianLinks: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            member: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async enterOrganizationAsSupport(userId: string, organizationId: string, ipAddress?: string) {
    const organization = await this.prisma.bypassRls(() =>
      this.prisma.organization.findUnique({ where: { id: organizationId } }),
    );
    if (!organization) throw new BadRequestException('Organization not found');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role !== UserRole.SUPPORT) throw new UnauthorizedException();

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        organizationId,
        action: 'SUPPORT_ORG_ACCESS',
        entityType: 'Organization',
        entityId: organizationId,
        metadata: { reason: 'support_enter' },
        ipAddress: ipAddress ?? null,
      },
    });

    return this.issueTokens(user.id, user.email, user.role, organizationId);
  }

  async leaveOrganizationAsSupport(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.role !== UserRole.SUPPORT) throw new UnauthorizedException();
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'SUPPORT_ORG_LEAVE',
        entityType: 'Organization',
        metadata: { reason: 'support_leave' },
      },
    });
    return this.issueTokens(user.id, user.email, user.role, null);
  }

  async updateProfile(userId: string, dto: { name?: string; phone?: string }) {
    const staff = await this.prisma.orgStaff.findUnique({ where: { userId } });
    if (!staff) return { success: true };
    await this.prisma.orgStaff.update({
      where: { userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });
    return this.me(userId);
  }

  private async uniqueJoinCode(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = generateJoinCode(8);
      const taken = await this.prisma.organization.findUnique({ where: { joinCode: code } });
      if (!taken) return code;
    }
    return generateJoinCode(10);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: JwtPayload['role'],
    organizationId: string | null,
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      organizationId,
      collegeId: organizationId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as JwtSignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role, organizationId, collegeId: organizationId },
    };
  }
}
