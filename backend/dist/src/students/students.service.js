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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PROFILE_INCLUDE = {
    user: { select: { id: true, email: true, isActive: true, createdAt: true } },
    college: { select: { id: true, name: true, code: true } },
};
let StudentsService = class StudentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(requester, query) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const where = {};
        if (requester.role === 'COLLEGE_ADMIN') {
            where.collegeId = requester.collegeId;
        }
        else if (query.collegeId) {
            where.collegeId = query.collegeId;
        }
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { studentNumber: { contains: query.search, mode: 'insensitive' } },
                { mobile: { contains: query.search, mode: 'insensitive' } },
                { user: { email: { contains: query.search, mode: 'insensitive' } } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: PROFILE_INCLUDE,
            }),
            this.prisma.student.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async findOneForRequester(requester, id) {
        const student = await this.prisma.student.findUnique({ where: { id }, include: PROFILE_INCLUDE });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        if (requester.role === 'COLLEGE_ADMIN' && student.collegeId !== requester.collegeId) {
            throw new common_1.ForbiddenException('This student belongs to a different college');
        }
        return student;
    }
    async findMe(userId) {
        const student = await this.prisma.student.findUnique({
            where: { userId },
            include: PROFILE_INCLUDE,
        });
        if (!student)
            throw new common_1.NotFoundException('Student profile not found');
        return student;
    }
    async updateMe(userId, dto) {
        const student = await this.prisma.student.findUnique({ where: { userId } });
        if (!student)
            throw new common_1.NotFoundException('Student profile not found');
        return this.prisma.student.update({
            where: { userId },
            data: {
                ...dto,
                dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            },
            include: PROFILE_INCLUDE,
        });
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentsService);
//# sourceMappingURL=students.service.js.map