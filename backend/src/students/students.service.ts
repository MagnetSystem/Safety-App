import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Paginated } from '../common/dto/pagination.dto';
import { generateInviteCode, hashToken } from '../common/codes';
import { isOrgOperator } from '../common/org-roles';

const BCRYPT_ROUNDS = 10;

const PROFILE_INCLUDE = {
  user: { select: { id: true, email: true, isActive: true, createdAt: true } },
  organization: {
    select: {
      id: true,
      name: true,
      code: true,
      industry: true,
      settings: true,
      organizationType: {
        select: {
          slug: true,
          label: true,
          blurb: true,
          memberFields: true,
          orgSetupFields: true,
          features: true,
        },
      },
    },
  },
  assignedDepartment: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(requester: AuthenticatedUser, query: QueryStudentsDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.MemberWhereInput = {};

    if (isOrgOperator(requester.role)) {
      where.organizationId = requester.organizationId!;
    } else if (query.collegeId) {
      where.organizationId = query.collegeId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { memberNumber: { contains: query.search, mode: 'insensitive' } },
        { mobile: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: PROFILE_INCLUDE,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        studentNumber: item.memberNumber,
        collegeId: item.organizationId,
        college: item.organization,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOneForRequester(requester: AuthenticatedUser, id: string) {
    const member = await this.prisma.member.findUnique({ where: { id }, include: PROFILE_INCLUDE });
    if (!member) throw new NotFoundException('Member not found');

    if (isOrgOperator(requester.role) && member.organizationId !== requester.organizationId) {
      throw new ForbiddenException('This member belongs to a different organization');
    }
    return member;
  }

  async findMe(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });
    if (!member) throw new NotFoundException('Member profile not found');
    return {
      ...member,
      studentNumber: member.memberNumber,
      collegeId: member.organizationId,
      college: member.organization,
    };
  }

  async updateMe(userId: string, dto: UpdateStudentProfileDto) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Member profile not found');

    const { studentNumber, assignedDepartmentId, profile, ...rest } = dto;
    return this.prisma.member.update({
      where: { userId },
      data: {
        ...rest,
        ...(studentNumber !== undefined ? { memberNumber: studentNumber } : {}),
        ...(assignedDepartmentId !== undefined ? { assignedDepartmentId } : {}),
        ...(profile !== undefined ? { profile: profile as object } : {}),
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: PROFILE_INCLUDE,
    });
  }

  async joinOrganization(userId: string, joinCode: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Member profile not found');
    if (member.organizationId) {
      throw new BadRequestException('You already belong to an organization');
    }

    const organization = await this.prisma.bypassRls(() =>
      this.prisma.organization.findUnique({ where: { joinCode: joinCode.trim().toUpperCase() } }),
    );
    if (!organization || organization.status !== 'ACTIVE') {
      throw new BadRequestException('Join code is invalid or the organization is not active');
    }

    return this.prisma.bypassRls(() =>
      this.prisma.member.update({
        where: { userId },
        data: { organizationId: organization.id },
        include: PROFILE_INCLUDE,
      }),
    );
  }

  async exportMe(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, role: true, createdAt: true } },
        organization: { select: { name: true, code: true } },
        incidents: {
          orderBy: { createdAt: 'asc' },
          include: {
            timeline: { orderBy: { createdAt: 'asc' } },
            messages: { orderBy: { createdAt: 'asc' } },
            evidence: { select: { fileName: true, type: true, createdAt: true } },
          },
        },
      },
    });
    if (!member) throw new NotFoundException('Member profile not found');

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { type: true, title: true, body: true, isRead: true, createdAt: true },
    });

    return {
      exportedAt: new Date().toISOString(),
      account: member.user,
      organization: member.organization,
      profile: member,
      notifications,
    };
  }

  async deleteMe(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new NotFoundException('Member profile not found');

    await this.prisma.$transaction([
      this.prisma.incident.updateMany({
        where: { memberId: member.id },
        data: { memberId: null },
      }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  }

  async resetPassword(memberId: string, dto: ResetPasswordDto) {
    const member = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member profile not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: member.userId }, data: { passwordHash } });
    return { success: true };
  }

  async bulkImport(
    requester: AuthenticatedUser,
    rows: { name: string; email: string; memberNumber?: string; guardianName?: string; guardianEmail?: string }[],
  ) {
    if (!requester.organizationId) throw new ForbiddenException('Organization is required');
    if (rows.length === 0) throw new BadRequestException('No rows to import');
    if (rows.length > 500) throw new BadRequestException('Import is limited to 500 rows at a time');

    const created: { email: string; temporaryPassword: string; guardianInviteCode?: string }[] = [];
    const errors: { email: string; error: string }[] = [];

    for (const row of rows) {
      try {
        const existing = await this.prisma.user.findUnique({ where: { email: row.email } });
        if (existing) throw new ConflictException('Email already exists');
        const temporaryPassword = `Tmp-${Math.random().toString(36).slice(2, 10)}A1`;
        const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

        const user = await this.prisma.user.create({
          data: {
            email: row.email,
            passwordHash,
            role: UserRole.MEMBER,
            member: {
              create: {
                name: row.name,
                organizationId: requester.organizationId,
                memberNumber: row.memberNumber,
                guardianName: row.guardianName,
              },
            },
          },
          include: { member: true },
        });

        let guardianInviteCode: string | undefined;
        if (row.guardianEmail || row.guardianName) {
          const raw = generateInviteCode();
          await this.prisma.guardianLink.create({
            data: {
              memberId: user.member!.id,
              inviteCodeHash: hashToken(raw),
              inviteCodeExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: 'PENDING',
            },
          });
          guardianInviteCode = raw;
        }

        created.push({ email: row.email, temporaryPassword, guardianInviteCode });
      } catch (err) {
        errors.push({ email: row.email, error: err instanceof Error ? err.message : 'Failed' });
      }
    }

    return { created, errors };
  }
}
