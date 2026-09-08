import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { TenantStore } from '../common/tenant';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Apply tenant GUC used by RLS policies. is_local=false so it lasts for the request connection. */
  async applyTenant(store: TenantStore) {
    await this.$executeRaw`SELECT set_config('app.bypass_rls', ${store.bypassRls ? 'true' : 'false'}, false)`;
    await this.$executeRaw`SELECT set_config('app.organization_id', ${store.organizationId ?? ''}, false)`;
    await this.$executeRaw`SELECT set_config('app.user_id', ${store.userId ?? ''}, false)`;
  }

  async clearTenant() {
    await this.$executeRaw`SELECT set_config('app.bypass_rls', 'false', false)`;
    await this.$executeRaw`SELECT set_config('app.organization_id', '', false)`;
    await this.$executeRaw`SELECT set_config('app.user_id', '', false)`;
  }

  /** Use for login, JWT validation, seed, and public lists where no tenant is known yet. */
  async bypassRls<T>(fn: () => Promise<T>): Promise<T> {
    await this.$executeRaw`SELECT set_config('app.bypass_rls', 'true', false)`;
    try {
      return await fn();
    } finally {
      await this.$executeRaw`SELECT set_config('app.bypass_rls', 'false', false)`;
    }
  }
}
