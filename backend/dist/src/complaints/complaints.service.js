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
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const complaints_util_1 = require("./complaints.util");
const DETAIL_INCLUDE = {
    student: { select: { id: true, name: true, studentNumber: true, mobile: true } },
    college: { select: { id: true, name: true, code: true } },
    evidence: true,
    timeline: { orderBy: { createdAt: 'asc' } },
};
const LIST_INCLUDE = {
    student: { select: { id: true, name: true, studentNumber: true } },
    college: { select: { id: true, name: true, code: true } },
    _count: { select: { evidence: true } },
};
let ComplaintsService = class ComplaintsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async create(user, dto) {
        const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
        if (!student)
            throw new common_1.NotFoundException('Student profile not found');
        const isEmergency = dto.type === 'EMERGENCY';
        const isAnonymous = dto.type === 'ANONYMOUS';
        const code = `CS-${new Date().getFullYear()}-${(0, crypto_1.randomUUID)().split('-')[0].toUpperCase()}`;
        const complaint = await this.prisma.complaint.create({
            data: {
                code,
                collegeId: student.collegeId,
                studentId: student.id,
                type: dto.type,
                category: dto.category,
                priority: isEmergency ? 'CRITICAL' : 'NORMAL',
                isAnonymous,
                description: dto.description,
                incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
                location: dto.location,
                suspectedStudents: dto.suspectedStudents,
                witnesses: dto.witnesses,
                gpsLat: isEmergency ? dto.gpsLat : undefined,
                gpsLng: isEmergency ? dto.gpsLng : undefined,
                gpsAccuracy: isEmergency ? dto.gpsAccuracy : undefined,
                deviceInfo: isEmergency ? dto.deviceInfo : undefined,
                timeline: {
                    create: { status: 'SUBMITTED', actorId: user.id, note: 'Report submitted' },
                },
            },
            include: DETAIL_INCLUDE,
        });
        await this.notifyOnSubmit(complaint, user.id);
        return (0, complaints_util_1.maskAnonymousComplaint)(complaint);
    }
    async notifyOnSubmit(complaint, studentUserId) {
        await this.notifications.create({
            userId: studentUserId,
            type: 'REPORT_SUBMITTED',
            title: 'Report submitted',
            body: `Your report ${complaint.code} has been submitted and is being reviewed.`,
            data: { complaintId: complaint.id },
        });
        const admins = await this.prisma.collegeAdmin.findMany({
            where: { collegeId: complaint.collegeId },
            select: { userId: true },
        });
        await this.notifications.createMany(admins.map((admin) => ({
            userId: admin.userId,
            type: complaint.priority === 'CRITICAL' ? 'NEW_EMERGENCY_REPORT' : 'NEW_COMPLAINT',
            title: complaint.priority === 'CRITICAL' ? 'New emergency report' : 'New complaint filed',
            body: `${complaint.code} · ${complaint.category.replaceAll('_', ' ')}`,
            data: { complaintId: complaint.id },
        })));
    }
    async findAll(user, query) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const where = {};
        if (user.role === 'STUDENT') {
            const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
            if (!student)
                throw new common_1.NotFoundException('Student profile not found');
            where.studentId = student.id;
        }
        else if (user.role === 'COLLEGE_ADMIN') {
            where.collegeId = user.collegeId;
        }
        else if (query.collegeId) {
            where.collegeId = query.collegeId;
        }
        if (query.status)
            where.status = query.status;
        if (query.type)
            where.type = query.type;
        if (query.category)
            where.category = query.category;
        if (query.priority)
            where.priority = query.priority;
        if (query.from || query.to) {
            where.createdAt = {
                gte: query.from ? new Date(query.from) : undefined,
                lte: query.to ? new Date(query.to) : undefined,
            };
        }
        const [items, total] = await Promise.all([
            this.prisma.complaint.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: LIST_INCLUDE,
            }),
            this.prisma.complaint.count({ where }),
        ]);
        return {
            items: items.map((item) => (0, complaints_util_1.maskAnonymousComplaint)(item)),
            total,
            page,
            pageSize,
        };
    }
    async findOneForRequester(user, id) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id }, include: DETAIL_INCLUDE });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        await this.assertAccess(user, complaint);
        return (0, complaints_util_1.maskAnonymousComplaint)(complaint);
    }
    async getTimeline(user, id) {
        const complaint = await this.prisma.complaint.findUnique({
            where: { id },
            include: { timeline: { orderBy: { createdAt: 'asc' } } },
        });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        await this.assertAccess(user, complaint);
        return complaint.timeline;
    }
    async updateStatus(user, id, dto) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id } });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        if (complaint.collegeId !== user.collegeId) {
            throw new common_1.ForbiddenException('This complaint belongs to a different college');
        }
        const updated = await this.prisma.complaint.update({
            where: { id },
            data: {
                status: dto.status,
                timeline: {
                    create: { status: dto.status, note: dto.note, actorId: user.id },
                },
            },
            include: DETAIL_INCLUDE,
        });
        if (updated.studentId) {
            const student = await this.prisma.student.findUnique({ where: { id: updated.studentId } });
            if (student)
                await this.notifyStatusChange(student.userId, updated);
        }
        return (0, complaints_util_1.maskAnonymousComplaint)(updated);
    }
    async notifyStatusChange(studentUserId, complaint) {
        const copy = {
            SUBMITTED: { title: 'Report submitted', body: 'Your report has been submitted.', type: 'REPORT_SUBMITTED' },
            UNDER_REVIEW: { title: 'Report under review', body: `${complaint.code} is now under review.`, type: 'STATUS_CHANGED' },
            INVESTIGATING: { title: 'Investigation started', body: `${complaint.code} is now being investigated.`, type: 'INVESTIGATION_STARTED' },
            MORE_INFO_REQUESTED: { title: 'More information needed', body: `The committee needs more information on ${complaint.code}.`, type: 'MORE_INFO_REQUESTED' },
            RESOLVED: { title: 'Report resolved', body: `${complaint.code} has been resolved.`, type: 'STATUS_CHANGED' },
            CLOSED: { title: 'Report closed', body: `${complaint.code} has been closed.`, type: 'REPORT_CLOSED' },
        };
        const entry = copy[complaint.status];
        await this.notifications.create({
            userId: studentUserId,
            type: entry.type,
            title: entry.title,
            body: entry.body,
            data: { complaintId: complaint.id },
        });
    }
    async assignCommittee(user, id, dto) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id } });
        if (!complaint)
            throw new common_1.NotFoundException('Complaint not found');
        if (complaint.collegeId !== user.collegeId) {
            throw new common_1.ForbiddenException('This complaint belongs to a different college');
        }
        const updated = await this.prisma.complaint.update({
            where: { id },
            data: {
                assignedCommitteeUserIds: dto.userIds,
                timeline: {
                    create: {
                        status: complaint.status === 'SUBMITTED' ? 'UNDER_REVIEW' : complaint.status,
                        note: 'Committee assigned',
                        actorId: user.id,
                    },
                },
                status: complaint.status === 'SUBMITTED' ? 'UNDER_REVIEW' : complaint.status,
            },
            include: DETAIL_INCLUDE,
        });
        return (0, complaints_util_1.maskAnonymousComplaint)(updated);
    }
    async assertAccess(user, complaint) {
        if (user.role === 'SUPER_ADMIN')
            return;
        if (user.role === 'COLLEGE_ADMIN') {
            if (complaint.collegeId !== user.collegeId) {
                throw new common_1.ForbiddenException('This complaint belongs to a different college');
            }
            return;
        }
        const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
        if (!student || complaint.studentId !== student.id) {
            throw new common_1.ForbiddenException('You do not have access to this complaint');
        }
    }
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map