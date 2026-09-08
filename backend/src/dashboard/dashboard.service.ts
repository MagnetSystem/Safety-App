import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../redis/cache.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const OPEN_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'MORE_INFO_REQUESTED'] as const;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

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
    return this.cacheService.wrap(
      `dashboard:staff:${organizationId}:${user.role === 'STAFF' ? user.id : 'org'}`,
      30,
      async () => {
      const assignedSql =
        user.role === 'STAFF' ? Prisma.sql`AND "assignedToUserId" = ${user.id}` : Prisma.empty;
      const assignedFilter = user.role === 'STAFF' ? { assignedToUserId: user.id } : {};
      const scope = { organizationId, ...assignedFilter };

      const [counts, byCategory, byMonth, byDepartment] = await Promise.all([
        this.prisma.$queryRaw<
          { today: bigint; emergency: bigint; pending: bigint; investigating: bigint; resolved: bigint }[]
        >`
          SELECT
            COUNT(*) FILTER (WHERE "createdAt" >= ${startOfToday()}) AS today,
            COUNT(*) FILTER (WHERE type = 'EMERGENCY') AS emergency,
            COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS pending,
            COUNT(*) FILTER (WHERE status = 'INVESTIGATING') AS investigating,
            COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED')) AS resolved
          FROM "incidents"
          WHERE "organizationId" = ${organizationId}
          ${assignedSql}`,
        this.prisma.incident.groupBy({ by: ['category'], where: scope, _count: true }),
        this.prisma.$queryRaw<{ month: string; count: bigint }[]>`
          SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
          FROM "incidents" WHERE "organizationId" = ${organizationId}
          ${assignedSql}
          GROUP BY month ORDER BY month DESC LIMIT 12`,
        this.prisma.$queryRaw<{ id: string | null; name: string | null; count: bigint }[]>`
          SELECT d.id, d.name, COUNT(i.id)::bigint as count
          FROM "incidents" i
          LEFT JOIN "departments" d ON d.id = i."departmentId"
          WHERE i."organizationId" = ${organizationId}
          GROUP BY d.id, d.name`,
      ]);

      const totals = counts[0] ?? { today: 0n, emergency: 0n, pending: 0n, investigating: 0n, resolved: 0n };

      return {
        todayReports: Number(totals.today),
        emergencyReports: Number(totals.emergency),
        pending: Number(totals.pending),
        investigating: Number(totals.investigating),
        resolved: Number(totals.resolved),
        byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
        byMonth: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
        byDepartment: byDepartment.map((d) => ({
          department: d.name ?? 'Unassigned',
          count: Number(d.count),
        })),
      };
    });
  }

  async forSupport() {
    return this.cacheService.wrap('dashboard:support', 60, async () => {
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
    });
  }
}
