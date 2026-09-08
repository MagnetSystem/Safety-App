import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  organizationId: string | null;
  userId: string | null;
  bypassRls: boolean;
}

export const tenantAls = new AsyncLocalStorage<TenantStore>();

export function getTenant(): TenantStore | undefined {
  return tenantAls.getStore();
}
