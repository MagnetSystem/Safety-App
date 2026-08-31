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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
const OPEN_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'INVESTIGATING', 'MORE_INFO_REQUESTED'];
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async forStudent(user) {
        const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
        if (!student)
            throw new common_1.NotFoundException('Student profile not found');
        const [total, emergency, open, resolved] = await Promise.all([
            this.prisma.complaint.count({ where: { studentId: student.id } }),
            this.prisma.complaint.count({ where: { studentId: student.id, type: 'EMERGENCY' } }),
            this.prisma.complaint.count({ where: { studentId: student.id, status: { in: [...OPEN_STATUSES] } } }),
            this.prisma.complaint.count({ where: { studentId: student.id, status: { in: ['RESOLVED', 'CLOSED'] } } }),
        ]);
        return { totalReports: total, emergencyReports: emergency, openReports: open, resolvedReports: resolved };
    }
    async forCollegeAdmin(user) {
        const collegeId = user.collegeId;
        const [today, emergency, pending, investigating, resolved, byCategory, byMonth, byDepartment] = await Promise.all([
            this.prisma.complaint.count({ where: { collegeId, createdAt: { gte: startOfToday() } } }),
            this.prisma.complaint.count({ where: { collegeId, type: 'EMERGENCY' } }),
            this.prisma.complaint.count({ where: { collegeId, status: 'SUBMITTED' } }),
            this.prisma.complaint.count({ where: { collegeId, status: 'INVESTIGATING' } }),
            this.prisma.complaint.count({ where: { collegeId, status: { in: ['RESOLVED', 'CLOSED'] } } }),
            this.prisma.complaint.groupBy({ by: ['category'], where: { collegeId }, _count: true }),
            this.prisma.$queryRaw `
          SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
          FROM "complaints" WHERE "collegeId" = ${collegeId}
          GROUP BY month ORDER BY month DESC LIMIT 12`,
            this.prisma.student.groupBy({
                by: ['department'],
                where: { collegeId, complaints: { some: {} } },
                _count: true,
            }),
        ]);
        return {
            todayReports: today,
            emergencyReports: emergency,
            pending,
            investigating,
            resolved,
            byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
            byMonth: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
            byDepartment: byDepartment.map((d) => ({ department: d.department ?? 'Unspecified', count: d._count })),
        };
    }
    async forSuperAdmin() {
        const [totalColleges, totalStudents, totalCollegeAdmins, totalReports, emergencyReports, resolvedReports, byState, byCollege, byCategory, byMonth,] = await Promise.all([
            this.prisma.college.count(),
            this.prisma.student.count(),
            this.prisma.collegeAdmin.count(),
            this.prisma.complaint.count(),
            this.prisma.complaint.count({ where: { type: 'EMERGENCY' } }),
            this.prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
            this.prisma.college.groupBy({ by: ['state'], _count: true }),
            this.prisma.complaint.groupBy({ by: ['collegeId'], _count: true }),
            this.prisma.complaint.groupBy({ by: ['category'], _count: true }),
            this.prisma.$queryRaw `
        SELECT to_char("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM "complaints" GROUP BY month ORDER BY month DESC LIMIT 12`,
        ]);
        const collegeNames = await this.prisma.college.findMany({
            where: { id: { in: byCollege.map((c) => c.collegeId) } },
            select: { id: true, name: true },
        });
        const nameById = new Map(collegeNames.map((c) => [c.id, c.name]));
        return {
            totalColleges,
            totalStudents,
            totalCollegeAdmins,
            totalReports,
            emergencyReports,
            resolvedReports,
            byState: byState.map((s) => ({ state: s.state ?? 'Unspecified', count: s._count })),
            byCollege: byCollege.map((c) => ({
                collegeId: c.collegeId,
                college: nameById.get(c.collegeId) ?? 'Unknown',
                count: c._count,
            })),
            byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
            byMonth: byMonth.map((m) => ({ month: m.month, count: Number(m.count) })),
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map