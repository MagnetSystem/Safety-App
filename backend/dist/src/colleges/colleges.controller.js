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
exports.CollegesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../common/decorators/audit.decorator");
const colleges_service_1 = require("./colleges.service");
const create_college_dto_1 = require("./dto/create-college.dto");
const update_college_dto_1 = require("./dto/update-college.dto");
const update_college_status_dto_1 = require("./dto/update-college-status.dto");
const query_colleges_dto_1 = require("./dto/query-colleges.dto");
let CollegesController = class CollegesController {
    collegesService;
    constructor(collegesService) {
        this.collegesService = collegesService;
    }
    create(dto) {
        return this.collegesService.create(dto);
    }
    findAll(query) {
        return this.collegesService.findAll(query);
    }
    findPublicActive() {
        return this.collegesService.findPublicActive();
    }
    findMine(user) {
        return this.collegesService.findOne(user.collegeId);
    }
    findOne(id) {
        return this.collegesService.findOne(id);
    }
    update(id, dto) {
        return this.collegesService.update(id, dto);
    }
    updateStatus(id, dto) {
        return this.collegesService.updateStatus(id, dto);
    }
};
exports.CollegesController = CollegesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_CREATED', entityType: 'College' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_college_dto_1.CreateCollegeDto]),
    __metadata("design:returntype", void 0)
], CollegesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_colleges_dto_1.QueryCollegesDto]),
    __metadata("design:returntype", void 0)
], CollegesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('public'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CollegesController.prototype, "findPublicActive", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.COLLEGE_ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CollegesController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CollegesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_UPDATED', entityType: 'College' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_college_dto_1.UpdateCollegeDto]),
    __metadata("design:returntype", void 0)
], CollegesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, audit_decorator_1.Audit)({ action: 'COLLEGE_STATUS_CHANGED', entityType: 'College' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_college_status_dto_1.UpdateCollegeStatusDto]),
    __metadata("design:returntype", void 0)
], CollegesController.prototype, "updateStatus", null);
exports.CollegesController = CollegesController = __decorate([
    (0, common_1.Controller)('colleges'),
    __metadata("design:paramtypes", [colleges_service_1.CollegesService])
], CollegesController);
//# sourceMappingURL=colleges.controller.js.map