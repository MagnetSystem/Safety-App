"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const BCRYPT_ROUNDS = 10;
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async registerStudent(dto) {
        const college = await this.prisma.college.findUnique({ where: { id: dto.collegeId } });
        if (!college || college.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('College not found or not active');
        }
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('An account with this email already exists');
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                role: 'STUDENT',
                student: {
                    create: {
                        name: dto.name,
                        collegeId: dto.collegeId,
                        studentNumber: dto.studentNumber,
                        mobile: dto.mobile,
                        department: dto.department,
                        course: dto.course,
                        year: dto.year,
                        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
                        gender: dto.gender,
                    },
                },
            },
            include: { student: true },
        });
        return this.issueTokens(user.id, user.email, user.role, dto.collegeId);
    }
    async registerCollege(dto) {
        const existingCollege = await this.prisma.college.findUnique({ where: { code: dto.collegeCode } });
        if (existingCollege)
            throw new common_1.ConflictException('A college with this code already exists');
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.adminEmail } });
        if (existingUser)
            throw new common_1.ConflictException('An account with this email already exists');
        const passwordHash = await bcrypt.hash(dto.adminPassword, BCRYPT_ROUNDS);
        const result = await this.prisma.$transaction(async (tx) => {
            const college = await tx.college.create({
                data: {
                    name: dto.collegeName,
                    code: dto.collegeCode,
                    state: dto.state,
                    district: dto.district,
                    principal: dto.principal,
                    phone: dto.phone,
                    email: dto.collegeEmail,
                    address: dto.address,
                    status: 'ACTIVE',
                },
            });
            const user = await tx.user.create({
                data: {
                    email: dto.adminEmail,
                    passwordHash,
                    role: 'COLLEGE_ADMIN',
                    collegeAdmin: {
                        create: {
                            name: dto.adminName,
                            phone: dto.adminPhone,
                            collegeId: college.id,
                        },
                    },
                },
                include: { collegeAdmin: true },
            });
            return { college, user };
        });
        return this.issueTokens(result.user.id, result.user.email, result.user.role, result.college.id);
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { student: true, collegeAdmin: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid email or password');
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid)
            throw new common_1.UnauthorizedException('Invalid email or password');
        if (!user.isActive)
            throw new common_1.UnauthorizedException('This account has been deactivated');
        const collegeId = user.student?.collegeId ?? user.collegeAdmin?.collegeId ?? null;
        if (collegeId) {
            const college = await this.prisma.college.findUnique({ where: { id: collegeId } });
            if (!college || college.status !== 'ACTIVE') {
                throw new common_1.UnauthorizedException('This college account has been suspended');
            }
        }
        return this.issueTokens(user.id, user.email, user.role, collegeId);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.isActive)
            throw new common_1.UnauthorizedException('Account no longer active');
        return this.issueTokens(user.id, user.email, user.role, payload.collegeId);
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Current password is incorrect');
        const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        return { success: true };
    }
    async me(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                student: true,
                collegeAdmin: { include: { college: true } },
            },
        });
    }
    async issueTokens(userId, email, role, collegeId) {
        const payload = { sub: userId, email, role, collegeId };
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
        return {
            accessToken,
            refreshToken,
            user: { id: userId, email, role, collegeId },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map