import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OrgRole, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { Paginated } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { canManageAdmins, canManageStaff, orgRoleToUserRole } from '../common/org-roles';

const BCRYPT_ROUNDS = 10;

const SAFE_SELECT = {
  id: true,
  name: true,
  phone: true,
  organizationId: true,
  orgRole: true,
  organization: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, email: true, isActive: true, role: true, createdAt: true } },
  departments: { include: { department: { select: { id: true, name: true, slug: true } } } },
} as const;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async create(requester: AuthenticatedUser, dto: CreateStaffDto) {
    const organizationId =
      requester.role === UserRole.SUPPORT
        ? (dto.organizationId ?? dto.collegeId)
        : requester.organizationId;
    if (!organizationId) throw new ForbiddenException('Organization is required');

    const orgRole = dto.orgRole ?? OrgRole.STAFF;
    if (orgRole === OrgRole.OWNER || orgRole === OrgRole.ADMIN) {
      if (!canManageAdmins(requester) && requester.role !== UserRole.SUPPORT) {
        throw new ForbiddenException('Only an Owner can add Admins');
      }
    } else if (!canManageStaff(requester) && requester.role !== UserRole.SUPPORT) {
      throw new ForbiddenException('You cannot add staff');
    }

    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new NotFoundException('Organization not found');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: orgRoleToUserRole(orgRole),
        orgStaff: {
          create: {
            name: dto.name,
            phone: dto.phone,
            organizationId,
            orgRole,
          },
        },
      },
      include: { orgStaff: true },
    });

    if (dto.departmentIds?.length && user.orgStaff) {
      await this.prisma.departmentStaff.createMany({
        data: dto.departmentIds.map((departmentId) => ({
          departmentId,
          orgStaffId: user.orgStaff!.id,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(user.orgStaff!.id);
  }

  async findAll(requester: AuthenticatedUser, query: QueryStaffDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const organizationId =
      requester.role === UserRole.SUPPORT
        ? (query.organizationId ?? query.collegeId ?? undefined)
        : requester.organizationId!;
    const where: Prisma.OrgStaffWhereInput = organizationId ? { organizationId } : {};

    const [items, total] = await Promise.all([
      this.prisma.orgStaff.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: SAFE_SELECT,
      }),
      this.prisma.orgStaff.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        collegeId: item.organizationId,
        college: item.organization,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const staff = await this.prisma.orgStaff.findUnique({ where: { id }, select: SAFE_SELECT });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    await this.findOne(id);
    await this.prisma.orgStaff.update({ where: { id }, data: dto });
    return this.findOne(id);
  }

  async updateStatus(id: string, isActive: boolean) {
    const staff = await this.prisma.orgStaff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException('Staff member not found');
    if (staff.orgRole === OrgRole.OWNER && !isActive) {
      throw new ForbiddenException('The owner account cannot be deactivated');
    }
    await this.prisma.user.update({ where: { id: staff.userId }, data: { isActive } });
    return this.findOne(id);
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const staff = await this.prisma.orgStaff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException('Staff member not found');
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: staff.userId }, data: { passwordHash } });
    return { success: true };
  }
}
