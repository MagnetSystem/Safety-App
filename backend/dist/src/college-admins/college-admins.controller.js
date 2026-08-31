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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollegeAdminsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const audit_decorator_1 = require("../common/decorators/audit.decorator");
const college_admins_service_1 = require("./college-admins.service");
const create_college_admin_dto_1 = require("./dto/create-college-admin.dto");
const update_college_admin_dto_1 = require("./dto/update-college-admin.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const query_college_admins_dto_1 = require("./dto/query-college-admins.dto");
let CollegeAdminsController = class CollegeAdminsController {
    collegeAdminsService;
    constructor(collegeAdminsService) {
        this.collegeAdminsService = collegeAdminsService;
    }
    create(dto) {
        return this.collegeAdminsService.create(dto);
    }
    findAll(query) {
        return this.collegeAdminsService.findAll(query);
    }
    findOne(id) {
        return this.collegeAdminsService.findOne(id);
    }
    update(id, dto) {
        return this.collegeAdminsService.update(id, dto);
    }
    activate(id) {
        return this.collegeAdminsService.updateStatus(id, true);
    }
    deactivate(id) {
        return this.collegeAdminsService.updateStatus(id, false);
    }
    resetPassword(id, dto) {
        return this.collegeAdminsService.resetPassword(id, dto);
    }
};
exports.CollegeAdminsController = CollegeAdminsController;
__decorate([
    (0, common_1.Post)(),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_ADMIN_CREATED', entityType: 'CollegeAdmin' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_college_admin_dto_1.CreateCollegeAdminDto]),
    __metadata("design:returntype", void 0)
], CollegeAdminsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_college_admins_dto_1.QueryCollegeAdminsDto]),
    __metadata("design:returntype", void 0)
], CollegeAdminsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CollegeAdminsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_ADMIN_UPDATED', entityType: 'CollegeAdmin' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_college_admin_dto_1.UpdateCollegeAdminDto]),
    __metadata("design:returntype", void 0)
], CollegeAdminsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_ADMIN_ACTIVATED', entityType: 'CollegeAdmin' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CollegeAdminsController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_ADMIN_DEACTIVATED', entityType: 'CollegeAdmin' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CollegeAdminsController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id/reset-password'),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_ADMIN_PASSWORD_RESET', entityType: 'CollegeAdmin' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], CollegeAdminsController.prototype, "resetPassword", null);
exports.CollegeAdminsController = CollegeAdminsController = __decorate([
    (0, common_1.Controller)('college-admins'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __metadata("design:paramtypes", [college_admins_service_1.CollegeAdminsService])
], CollegeAdminsController);
//# sourceMappingURL=college-admins.controller.js.map