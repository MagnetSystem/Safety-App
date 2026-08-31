import { SetMetadata } from '@nestjs/common';

export interface AuditMeta {
  action: string;
  entityType: string;
  /** Name of the route param holding the entity id, e.g. 'id'. Defaults to 'id'. */
  entityIdParam?: string;
}

export const AUDIT_KEY = 'audit';
/** Marks a route as a sensitive action to be written to the audit log automatically. */
export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_KEY, meta);
