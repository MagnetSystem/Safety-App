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
export declare class AuditLogsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    record(input: RecordAuditLogInput): Promise<{
        id: string;
        createdAt: Date;
        collegeId: string | null;
        actorId: string | null;
        action: string;
        entityType: string;
        entityId: string | null;
        metadata: Prisma.JsonValue | null;
        ipAddress: string | null;
    }>;
    findAll(user: AuthenticatedUser, query: QueryAuditLogsDto): Promise<Paginated<unknown>>;
}
export {};
