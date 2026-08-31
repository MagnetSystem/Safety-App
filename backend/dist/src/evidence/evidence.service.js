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
exports.EvidenceService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const storage_service_1 = require("./storage.service");
let EvidenceService = class EvidenceService {
    prisma;
    storage;
    notifications;
    constructor(prisma, storage, notifications) {
        this.prisma = prisma;
        this.storage = storage;
        this.notifications = notifications;
    }
    async getComplaintWithAccess(user, complaintId) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        if (user.role === 'COLLEGE_ADMIN' && complaint.collegeId !== user.collegeId) {
            throw new common_1.NotFoundException('Complaint not found');
        }
        if (user.role === 'STUDENT') {
            const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
            if (!student || complaint.studentId !== student.id) {
                throw new common_1.NotFoundException('Complaint not found');
            }
        }
        return complaint;
    }
    async requestUploadUrl(user, complaintId, dto) {
        await this.getComplaintWithAccess(user, complaintId);
        const storagePath = `${complaintId}/${(0, crypto_1.randomUUID)()}-${dto.fileName}`;
        const signed = await this.storage.createSignedUploadUrl(storagePath);
        return { uploadUrl: signed.signedUrl, token: signed.token, storagePath };
    }
    async confirmUpload(user, complaintId, dto) {
        const complaint = await this.getComplaintWithAccess(user, complaintId);
        const evidence = await this.prisma.complaintEvidence.create({
            data: {
                complaintId,
                type: dto.type,
                storagePath: dto.storagePath,
                fileName: dto.fileName,
                mimeType: dto.mimeType,
                sizeBytes: dto.sizeBytes,
                uploadedById: user.id,
            },
        });
        const admins = await this.prisma.collegeAdmin.findMany({
            where: { collegeId: complaint.collegeId },
            select: { userId: true },
        });
        await this.notifications.createMany(admins.map((admin) => ({
            userId: admin.userId,
            type: 'NEW_EVIDENCE_UPLOADED',
            title: 'New evidence uploaded',
            body: `New evidence added to ${complaint.code}`,
            data: { complaintId, evidenceId: evidence.id },
        })));
        return evidence;
    }
    async list(user, complaintId) {
        await this.getComplaintWithAccess(user, complaintId);
        const rows = await this.prisma.complaintEvidence.findMany({
            where: { complaintId },
            orderBy: { createdAt: 'desc' },
        });
        return Promise.all(rows.map(async (row) => ({
            ...row,
            downloadUrl: await this.storage.createSignedDownloadUrl(row.storagePath),
        })));
    }
};
exports.EvidenceService = EvidenceService;
exports.EvidenceService = EvidenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        notifications_service_1.NotificationsService])
], EvidenceService);
//# sourceMappingURL=evidence.service.js.map