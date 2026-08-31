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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const RESULT_LIMIT = 20;
let SearchService = class SearchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(user, q) {
        const collegeScope = user.role === 'COLLEGE_ADMIN' ? { collegeId: user.collegeId } : {};
        const complaintCollegeScope = user.role === 'COLLEGE_ADMIN' ? { collegeId: user.collegeId } : {};
        const [students, complaints, colleges] = await Promise.all([
            this.prisma.student.findMany({
                where: {
                    ...collegeScope,
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { studentNumber: { contains: q, mode: 'insensitive' } },
                        { mobile: { contains: q, mode: 'insensitive' } },
                        { user: { email: { contains: q, mode: 'insensitive' } } },
                    ],
                },
                take: RESULT_LIMIT,
                select: {
                    id: true,
                    name: true,
                    studentNumber: true,
                    college: { select: { id: true, name: true } },
                    user: { select: { email: true } },
                },
            }),
            this.prisma.complaint.findMany({
                where: { ...complaintCollegeScope, code: { contains: q, mode: 'insensitive' } },
                take: RESULT_LIMIT,
                select: { id: true, code: true, status: true, type: true, category: true, collegeId: true },
            }),
            user.role === 'SUPER_ADMIN'
                ? this.prisma.college.findMany({
                    where: {
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { code: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    take: RESULT_LIMIT,
                })
                : Promise.resolve([]),
        ]);
        return { students, complaints, colleges };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map