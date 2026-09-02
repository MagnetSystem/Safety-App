import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { RegisterCollegeDto } from './dto/register-college.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';
import type { JwtPayload } from './types/jwt-payload.interface';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mail: MailService,
  ) {}

  async registerStudent(dto: RegisterStudentDto) {
    const college = await this.prisma.college.findUnique({ where: { id: dto.collegeId } });
    if (!college || college.status !== 'ACTIVE') {
      throw new BadRequestException('College not found or not active');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'STUDENT',
        student: {
          create: {
            name: dto.name,
            collegeId: dto.collegeId,
            studentNumber: dto.studentNumber,
            mobile: dto.mobile,
            department: dto.department,
            course: dto.course,
            year: dto.year,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
          },
        },
      },
      include: { student: true },
    });

    return this.issueTokens(user.id, user.email, user.role, dto.collegeId);
  }

  async registerCollege(dto: RegisterCollegeDto) {
    // Check for duplicate college code
    const existingCollege = await this.prisma.college.findUnique({ where: { code: dto.collegeCode } });
    if (existingCollege) throw new ConflictException('A college with this code already exists');

    // Check for duplicate admin email
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.adminEmail } });
    if (existingUser) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.adminPassword, BCRYPT_ROUNDS);

    // Create college + admin in one transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const college = await tx.college.create({
        data: {
          name: dto.collegeName,
          code: dto.collegeCode,
          state: dto.state,
          district: dto.district,
          principal: dto.principal,
          phone: dto.phone,
          email: dto.collegeEmail,
          address: dto.address,
          status: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.adminEmail,
          passwordHash,
          role: 'COLLEGE_ADMIN',
          collegeAdmin: {
            create: {
              name: dto.adminName,
              phone: dto.adminPhone,
              collegeId: college.id,
            },
          },
        },
        include: { collegeAdmin: true },
      });

      return { college, user };
    });

    return this.issueTokens(
      result.user.id,
      result.user.email,
      result.user.role,
      result.college.id,
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { student: true, collegeAdmin: true },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedException('This account has been deactivated');

    const collegeId = user.student?.collegeId ?? user.collegeAdmin?.collegeId ?? null;
    if (collegeId) {
      const college = await this.prisma.college.findUnique({ where: { id: collegeId } });
      if (!college || college.status !== 'ACTIVE') {
        throw new UnauthorizedException('This college account has been suspended');
      }
    }

    return this.issueTokens(user.id, user.email, user.role, collegeId);
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

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('Account no longer active');

    return this.issueTokens(user.id, user.email, user.role, payload.collegeId);
  }

  /**
   * Always resolves the same way whether or not the email exists — never
   * reveal which addresses have accounts.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
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
        'Reset your Campus Safety password',
        `We received a request to reset your password.\n\nOpen this link to choose a new one (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      );
    }
    return { message: 'If that email has an account, a reset link is on its way.' };
  }

  private buildResetLink(role: JwtPayload['role'], token: string): string {
    if (role === 'STUDENT') {
      const scheme = this.configService.get<string>('STUDENT_APP_SCHEME') ?? 'studentapp';
      return `${scheme}://reset-password?token=${token}`;
    }
    const base = this.configService.get<string>('ADMIN_PORTAL_URL') ?? '';
    return `${base}/reset-password?token=${token}`;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

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
      // Invalidate any other outstanding tokens for this user.
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
        student: true,
        collegeAdmin: { include: { college: true } },
      },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: JwtPayload['role'],
    collegeId: string | null,
  ) {
    const payload: JwtPayload = { sub: userId, email, role, collegeId };

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
      user: { id: userId, email, role, collegeId },
    };
  }
}
