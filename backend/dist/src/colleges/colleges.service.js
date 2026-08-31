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
exports.CollegesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CollegesService = class CollegesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.college.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('A college with this code already exists');
        return this.prisma.college.create({ data: dto });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 20;
        const where = query.search
            ? {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { code: { contains: query.search, mode: 'insensitive' } },
                    { state: { contains: query.search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [items, total] = await Promise.all([
            this.prisma.college.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    _count: { select: { students: true, admins: true, complaints: true } },
                },
            }),
            this.prisma.college.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async findPublicActive() {
        return this.prisma.college.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, code: true, state: true, district: true },
        });
    }
    async findOne(id) {
        const college = await this.prisma.college.findUnique({
            where: { id },
            include: { _count: { select: { students: true, admins: true, complaints: true } } },
        });
        if (!college)
            throw new common_1.NotFoundException('College not found');
        return college;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.college.update({ where: { id }, data: dto });
    }
    async updateStatus(id, dto) {
        await this.findOne(id);
        return this.prisma.college.update({ where: { id }, data: { status: dto.status } });
    }
};
exports.CollegesService = CollegesService;
exports.CollegesService = CollegesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollegesService);
//# sourceMappingURL=colleges.service.js.map