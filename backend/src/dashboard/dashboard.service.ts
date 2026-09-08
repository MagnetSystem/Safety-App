import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const OPEN_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'MORE_INFO_REQUESTED'] as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async forMember(user: AuthenticatedUser) {
    const member = await this.prisma.member.findUnique({ where: { userId: user.id } });
    if (!member) throw new NotFoundException('Member profile not found');

    const [total, emergency, open, resolved] = await Promise.all([
      this.prisma.incident.count({ where: { memberId: member.id } }),
      this.prisma.incident.count({ where: { memberId: member.id, type: 'EMERGENCY' } }),
      this.prisma.incident.count({ where: { memberId: member.id, status: { in: [...OPEN_STATUSES] } } }),
      this.prisma.incident.count({ where: { memberId: member.id, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    return { totalReports: total, emergencyReports: emergency, openReports: open, resolvedReports: resolved };
  }

  async forStaff(user: AuthenticatedUser) {
    const organizationId = user.organizationId!;
    const assignedFilter = user.role === 'STAFF' ? { assignedToUserId: user.id } : {};
    const scope = { organizationId, ...assignedFilter };

    const [today, emergency, pending, investigating, resolved, byCategory, byMonth, byDepartment] = await Promise.all([
      this.prisma.incident.count({ where: { ...scope, createdAt: { gte: startOfToday() } } }),
      this.prisma.incident.count({ where: { ...scope, type: 'EMERGENCY' } }),
      this.prisma.incident.count({ where: { ...scope, status: 'SUBMITTED' } }),
      this.prisma.incident.count({ where: { ...scope, status: 'INVESTIGATING' } }),
      this.prisma.incident.count({ where: { ...scope, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.incident.groupBy({ by: ['category'], where: scope, _count: true }),
      this.prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM "incidents" WHERE "organizationId" = ${organizationId}
        ${user.role === 'STAFF' ? Prisma.sql`AND "assignedToUserId" = ${user.id}` : Prisma.empty}
        GROUP BY month ORDER BY month DESC LIMIT 12`,
      this.prisma.incident.groupBy({ by: ['departmentId'], where: { organizationId }, _count: true }),
    ]);

    const deptIds = byDepartment.map((d) => d.departmentId).filter((id): id is string => !!id);
    const deptRows = deptIds.length
      ? await this.prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } })
      : [];
    const deptName = new Map(deptRows.map((d) => [d.id, d.name]));

    return {
      todayReports: today,
      emergencyReports: emergency,
      pending,
      investigating,
      resolved,
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
      byMonth: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
      byDepartment: byDepartment.map((d) => ({
        department: d.departmentId ? deptName.get(d.departmentId) ?? 'Unassigned' : 'Unassigned',
        count: d._count,
      })),
    };
  }

  async forSupport() {
    return this.prisma.bypassRls(async () => {
      const [
        totalOrganizations,
        totalMembers,
        totalStaff,
        totalReports,
        emergencyReports,
        resolvedReports,
        byState,
        byOrganization,
        byCategory,
        byMonth,
      ] = await Promise.all([
        this.prisma.organization.count(),
        this.prisma.member.count(),
        this.prisma.orgStaff.count(),
        this.prisma.incident.count(),
        this.prisma.incident.count({ where: { type: 'EMERGENCY' } }),
        this.prisma.incident.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
        this.prisma.organization.groupBy({ by: ['state'], _count: true }),
        this.prisma.incident.groupBy({ by: ['organizationId'], _count: true }),
        this.prisma.incident.groupBy({ by: ['category'], _count: true }),
        this.prisma.$queryRaw<{ month: string; count: bigint }[]>`
          SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
          FROM "incidents" GROUP BY month ORDER BY month DESC LIMIT 12`,
      ]);

      const orgIds = byOrganization.map((c) => c.organizationId).filter((id): id is string => !!id);
      const orgNames = await this.prisma.organization.findMany({
        where: { id: { in: orgIds } },
        select: { id: true, name: true },
      });
      const nameById = new Map(orgNames.map((c) => [c.id, c.name]));

      return {
        totalOrganizations,
        totalMembers,
        totalStaff,
        totalReports,
        emergencyReports,
        resolvedReports,
        // Aliases so the existing admin UI keeps rendering while it is updated.
        totalColleges: totalOrganizations,
        totalStudents: totalMembers,
        totalCollegeAdmins: totalStaff,
        byState: byState.map((s) => ({ state: s.state ?? 'Unspecified', count: s._count })),
        byOrganization: byOrganization.map((c) => ({
          organizationId: c.organizationId,
          organization: c.organizationId ? nameById.get(c.organizationId) ?? 'Unknown' : 'Standalone',
          count: c._count,
        })),
        byCollege: byOrganization.map((c) => ({
          collegeId: c.organizationId,
          college: c.organizationId ? nameById.get(c.organizationId) ?? 'Unknown' : 'Standalone',
          count: c._count,
        })),
        byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
        byMonth: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
      };
    });
  }
}
