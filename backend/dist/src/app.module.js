"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const env_validation_1 = require("./config/env.validation");
const prisma_module_1 = require("./prisma/prisma.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const audit_log_interceptor_1 = require("./common/interceptors/audit-log.interceptor");
const auth_module_1 = require("./auth/auth.module");
const colleges_module_1 = require("./colleges/colleges.module");
const college_admins_module_1 = require("./college-admins/college-admins.module");
const students_module_1 = require("./students/students.module");
const complaints_module_1 = require("./complaints/complaints.module");
const evidence_module_1 = require("./evidence/evidence.module");
const notifications_module_1 = require("./notifications/notifications.module");
const audit_logs_module_1 = require("./audit-logs/audit-logs.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const search_module_1 = require("./search/search.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, validationSchema: env_validation_1.envValidationSchema }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            colleges_module_1.CollegesModule,
            college_admins_module_1.CollegeAdminsModule,
            students_module_1.StudentsModule,
            complaints_module_1.ComplaintsModule,
            evidence_module_1.EvidenceModule,
            notifications_module_1.NotificationsModule,
            audit_logs_module_1.AuditLogsModule,
            dashboard_module_1.DashboardModule,
            search_module_1.SearchModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_INTERCEPTOR, useClass: audit_log_interceptor_1.AuditLogInterceptor },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map