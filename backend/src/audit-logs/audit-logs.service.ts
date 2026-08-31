import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { Paginated } from '../common/dto/pagination.dto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

interface RecordAuditLogInput {
  actorId: string | null;
  collegeId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
}

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        collegeId: input.collegeId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ipAddress: input.ipAddress ?? null,
      },
    });
  }

  async findAll(user: AuthenticatedUser, query: QueryAuditLogsDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.AuditLogWhereInput = {};

    // College Admins may only ever see their own college's audit trail.
    if (user.role === 'COLLEGE_ADMIN') {
      where.collegeId = user.collegeId;
    } else if (query.collegeId) {
      where.collegeId = query.collegeId;
    }

    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: { select: { id: true, email: true, role: true } },
          college: { select: { id: true, name: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
