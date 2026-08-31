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
exports.AuditLogsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditLogsService = class AuditLogsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async record(input) {
        return this.prisma.auditLog.create({
            data: {
                actorId: input.actorId,
                collegeId: input.collegeId,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId ?? null,
                metadata: input.metadata ?? client_1.Prisma.JsonNull,
                ipAddress: input.ipAddress ?? null,
            },
        });
    }
    async findAll(user, query) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const where = {};
        if (user.role === 'COLLEGE_ADMIN') {
            where.collegeId = user.collegeId;
        }
        else if (query.collegeId) {
            where.collegeId = query.collegeId;
        }
        if (query.action)
            where.action = query.action;
        if (query.entityType)
            where.entityType = query.entityType;
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    actor: { select: { id: true, email: true, role: true } },
                    college: { select: { id: true, name: true } },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
};
exports.AuditLogsService = AuditLogsService;
exports.AuditLogsService = AuditLogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogsService);
//# sourceMappingURL=audit-logs.service.js.map