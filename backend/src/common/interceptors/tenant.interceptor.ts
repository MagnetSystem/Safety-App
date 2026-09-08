import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { tenantAls, type TenantStore } from '../tenant';
import type { AuthenticatedUser } from '../../auth/types/jwt-payload.interface';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;
    const store: TenantStore = {
      organizationId: user?.organizationId ?? null,
      userId: user?.id ?? null,
      bypassRls: user?.role === 'SUPPORT',
    };

    return new Observable((subscriber) => {
      const inner = tenantAls.run(store, () =>
        new Observable((innerSub) => {
          void this.prisma
            .applyTenant(store)
            .then(() => {
              next.handle().subscribe({
                next: (v) => innerSub.next(v),
                error: (e) => innerSub.error(e),
                complete: () => innerSub.complete(),
              });
            })
            .catch((e) => innerSub.error(e));
        }).pipe(finalize(() => void this.prisma.clearTenant())),
      );
      inner.subscribe(subscriber);
    });
  }
}
