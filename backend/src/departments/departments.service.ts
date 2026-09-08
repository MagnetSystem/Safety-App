import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import { catalogFor } from '../common/industry';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'dept';
}

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async seedDefaults(organizationId: string, industry: Parameters<typeof catalogFor>[0]) {
    const templates = catalogFor(industry).defaultDepartments;
    if (templates.length === 0) return [];
    const existing = await this.prisma.department.count({ where: { organizationId } });
    if (existing > 0) return this.list(organizationId);
    await this.prisma.department.createMany({
      data: templates.map((t, i) => ({
        organizationId,
        name: t.name,
        slug: t.slug,
        description: t.description,
        isDefault: i === 0,
      })),
    });
    await this.cache.invalidateOrg(organizationId);
    return this.list(organizationId);
  }

  async list(organizationId: string) {
    return this.cache.wrap(this.cache.orgKey(organizationId, 'departments'), 60, () =>
      this.prisma.department.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { members: true, staff: true, incidents: true } },
        },
      }),
    );
  }

  async create(organizationId: string, dto: { name: string; description?: string; isDefault?: boolean }) {
    const slug = await this.uniqueSlug(organizationId, slugify(dto.name));
    if (dto.isDefault) {
      await this.prisma.department.updateMany({ where: { organizationId }, data: { isDefault: false } });
    }
    const created = await this.prisma.department.create({
      data: { organizationId, name: dto.name.trim(), slug, description: dto.description, isDefault: dto.isDefault ?? false },
    });
    await this.cache.invalidateOrg(organizationId);
    return created;
  }

  async update(organizationId: string, id: string, dto: { name?: string; description?: string; isDefault?: boolean }) {
    const dept = await this.requireDept(organizationId, id);
    if (dto.isDefault) {
      await this.prisma.department.updateMany({ where: { organizationId }, data: { isDefault: false } });
    }
    const updated = await this.prisma.department.update({
      where: { id: dept.id },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
        isDefault: dto.isDefault,
        ...(dto.name ? { slug: await this.uniqueSlug(organizationId, slugify(dto.name), id) } : {}),
      },
    });
    await this.cache.invalidateOrg(organizationId);
    return updated;
  }

  async remove(organizationId: string, id: string) {
    const dept = await this.requireDept(organizationId, id);
    await this.prisma.incident.updateMany({ where: { departmentId: id }, data: { departmentId: null } });
    await this.prisma.member.updateMany({ where: { assignedDepartmentId: id }, data: { assignedDepartmentId: null } });
    await this.prisma.department.delete({ where: { id: dept.id } });
    await this.cache.invalidateOrg(organizationId);
    return { success: true };
  }

  async assignStaff(organizationId: string, departmentId: string, orgStaffId: string) {
    await this.requireDept(organizationId, departmentId);
    const staff = await this.prisma.orgStaff.findUnique({ where: { id: orgStaffId } });
    if (!staff || staff.organizationId !== organizationId) {
      throw new BadRequestException('Staff member is not in this organization');
    }
    await this.prisma.departmentStaff.upsert({
      where: { departmentId_orgStaffId: { departmentId, orgStaffId } },
      create: { departmentId, orgStaffId },
      update: {},
    });
    await this.cache.invalidateOrg(organizationId);
    return this.listStaff(organizationId, departmentId);
  }

  async removeStaff(organizationId: string, departmentId: string, orgStaffId: string) {
    await this.requireDept(organizationId, departmentId);
    await this.prisma.departmentStaff.deleteMany({ where: { departmentId, orgStaffId } });
    await this.cache.invalidateOrg(organizationId);
    return { success: true };
  }

  async listStaff(organizationId: string, departmentId: string) {
    await this.requireDept(organizationId, departmentId);
    return this.prisma.departmentStaff.findMany({
      where: { departmentId },
      include: {
        orgStaff: {
          select: { id: true, name: true, orgRole: true, user: { select: { id: true, email: true } } },
        },
      },
    });
  }

  async departmentIdsForStaffUser(userId: string): Promise<string[]> {
    const staff = await this.prisma.orgStaff.findUnique({
      where: { userId },
      select: { departments: { select: { departmentId: true } } },
    });
    return staff?.departments.map((d) => d.departmentId) ?? [];
  }

  private async requireDept(organizationId: string, id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept || dept.organizationId !== organizationId) throw new NotFoundException('Department not found');
    return dept;
  }

  private async uniqueSlug(organizationId: string, base: string, exceptId?: string) {
    let slug = base;
    for (let i = 0; i < 8; i++) {
      const taken = await this.prisma.department.findFirst({
        where: { organizationId, slug, ...(exceptId ? { id: { not: exceptId } } : {}) },
      });
      if (!taken) return slug;
      slug = `${base}-${i + 2}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  assertOrg(user: AuthenticatedUser) {
    if (!user.organizationId) throw new BadRequestException('Organization context required');
    return user.organizationId;
  }
}

export type { Prisma };
