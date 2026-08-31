import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(user: AuthenticatedUser, query: QueryAuditLogsDto): Promise<import("../common/dto/pagination.dto").Paginated<unknown>>;
}
