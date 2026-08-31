import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY, AuditMeta } from '../decorators/audit.decorator';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

/**
 * Writes an AuditLog row after any handler decorated with @Audit() succeeds.
 * Keeps "record every sensitive action" out of individual controllers/services.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AuditMeta | undefined>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!meta) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string; collegeId: string | null } | undefined;

    return next.handle().pipe(
      tap((result) => {
        const idParam = meta.entityIdParam ?? 'id';
        const entityId = request.params?.[idParam] ?? result?.id ?? null;

        this.auditLogsService
          .record({
            actorId: user?.id ?? null,
            collegeId: user?.collegeId ?? null,
            action: meta.action,
            entityType: meta.entityType,
            entityId,
            metadata: safeMetadata(request.body),
            ipAddress: request.ip,
          })
          .catch(() => undefined); // audit logging must never break the request
      }),
    );
  }
}

function safeMetadata(body: unknown) {
  if (!body || typeof body !== 'object') return undefined;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  delete clone.password;
  delete clone.passwordHash;
  return clone;
}
