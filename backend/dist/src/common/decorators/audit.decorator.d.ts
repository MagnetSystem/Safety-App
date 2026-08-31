export interface AuditMeta {
    action: string;
    entityType: string;
    entityIdParam?: string;
}
export declare const AUDIT_KEY = "audit";
export declare const Audit: (meta: AuditMeta) => import("@nestjs/common").CustomDecorator<string>;
