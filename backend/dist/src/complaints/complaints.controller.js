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
exports.ComplaintsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const audit_decorator_1 = require("../common/decorators/audit.decorator");
const complaints_service_1 = require("./complaints.service");
const create_complaint_dto_1 = require("./dto/create-complaint.dto");
const update_complaint_status_dto_1 = require("./dto/update-complaint-status.dto");
const assign_committee_dto_1 = require("./dto/assign-committee.dto");
const query_complaints_dto_1 = require("./dto/query-complaints.dto");
let ComplaintsController = class ComplaintsController {
    complaintsService;
    constructor(complaintsService) {
        this.complaintsService = complaintsService;
    }
    create(user, dto) {
        return this.complaintsService.create(user, dto);
    }
    findAll(user, query) {
        return this.complaintsService.findAll(user, query);
    }
    findOne(user, id) {
        return this.complaintsService.findOneForRequester(user, id);
    }
    getTimeline(user, id) {
        return this.complaintsService.getTimeline(user, id);
    }
    updateStatus(user, id, dto) {
        return this.complaintsService.updateStatus(user, id, dto);
    }
    assignCommittee(user, id, dto) {
        return this.complaintsService.assignCommittee(user, id, dto);
    }
};
exports.ComplaintsController = ComplaintsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.UserRole.STUDENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_complaint_dto_1.CreateComplaintDto]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_complaints_dto_1.QueryComplaintsDto]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, audit_decorator_1.Audit)({ action: 'COMPLAINT_VIEWED', entityType: 'Complaint' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.COLLEGE_ADMIN),
    (0, audit_decorator_1.Audit)({ action: 'COMPLAINT_STATUS_CHANGED', entityType: 'Complaint' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_complaint_status_dto_1.UpdateComplaintStatusDto]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.COLLEGE_ADMIN),
    (0, audit_decorator_1.Audit)({ action: 'COMPLAINT_COMMITTEE_ASSIGNED', entityType: 'Complaint' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assign_committee_dto_1.AssignCommitteeDto]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "assignCommittee", null);
exports.ComplaintsController = ComplaintsController = __decorate([
    (0, common_1.Controller)('complaints'),
    __metadata("design:paramtypes", [complaints_service_1.ComplaintsService])
], ComplaintsController);
//# sourceMappingURL=complaints.controller.js.map