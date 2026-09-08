import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { isOrgOperator } from '../common/org-roles';

const RESULT_LIMIT = 20;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(user: AuthenticatedUser, q: string) {
    const memberScope: Prisma.MemberWhereInput = isOrgOperator(user.role)
      ? { organizationId: user.organizationId! }
      : {};
    const incidentScope: Prisma.IncidentWhereInput = user.role === UserRole.STAFF
      ? { organizationId: user.organizationId!, assignedToUserId: user.id }
      : isOrgOperator(user.role)
        ? { organizationId: user.organizationId! }
        : {};

    const run = async () => {
      const [members, incidents, organizations] = await Promise.all([
        this.prisma.member.findMany({
          where: {
            ...memberScope,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { memberNumber: { contains: q, mode: 'insensitive' } },
              { mobile: { contains: q, mode: 'insensitive' } },
              { user: { email: { contains: q, mode: 'insensitive' } } },
            ],
          },
          take: RESULT_LIMIT,
          select: {
            id: true,
            name: true,
            memberNumber: true,
            organization: { select: { id: true, name: true } },
            user: { select: { email: true } },
          },
        }),
        this.prisma.incident.findMany({
          where: { ...incidentScope, code: { contains: q, mode: 'insensitive' } },
          take: RESULT_LIMIT,
          select: { id: true, code: true, status: true, type: true, category: true, organizationId: true },
        }),
        user.role === UserRole.SUPPORT
          ? this.prisma.organization.findMany({
              where: {
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { code: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: RESULT_LIMIT,
            })
          : Promise.resolve([]),
      ]);

      return {
        members,
        incidents,
        organizations,
        students: members,
        complaints: incidents,
        colleges: organizations,
      };
    };

    return user.role === UserRole.SUPPORT ? this.prisma.bypassRls(run) : run();
  }
}
