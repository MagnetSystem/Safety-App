import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';
export declare class AuditLogInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly auditLogsService;
    constructor(reflector: Reflector, auditLogsService: AuditLogsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
