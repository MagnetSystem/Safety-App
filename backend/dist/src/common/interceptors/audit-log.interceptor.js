"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const audit_decorator_1 = require("../decorators/audit.decorator");
const audit_logs_service_1 = require("../../audit-logs/audit-logs.service");
let AuditLogInterceptor = class AuditLogInterceptor {
    reflector;
    auditLogsService;
    constructor(reflector, auditLogsService) {
        this.reflector = reflector;
        this.auditLogsService = auditLogsService;
    }
    intercept(context, next) {
        const meta = this.reflector.getAllAndOverride(audit_decorator_1.AUDIT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!meta)
            return next.handle();
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return next.handle().pipe((0, rxjs_1.tap)((result) => {
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
                .catch(() => undefined);
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_logs_service_1.AuditLogsService])
], AuditLogInterceptor);
function safeMetadata(body) {
    if (!body || typeof body !== 'object')
        return undefined;
    const clone = { ...body };
    delete clone.password;
    delete clone.passwordHash;
    return clone;
}
//# sourceMappingURL=audit-log.interceptor.js.map