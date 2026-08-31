import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { RegisterCollegeDto } from './dto/register-college.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    registerStudent(dto: RegisterStudentDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            collegeId: string | null;
        };
    }>;
    registerCollege(dto: RegisterCollegeDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            collegeId: string | null;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            collegeId: string | null;
        };
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            collegeId: string | null;
        };
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    me(userId: string): Promise<{
        id: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        createdAt: Date;
        student: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            collegeId: string;
            userId: string;
            photoUrl: string | null;
            studentNumber: string | null;
            dateOfBirth: Date | null;
            gender: string | null;
            department: string | null;
            course: string | null;
            semester: string | null;
            year: number | null;
            section: string | null;
            isHosteler: boolean | null;
            mobile: string | null;
            guardianName: string | null;
            guardianPhone: string | null;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            permanentAddress: string | null;
            hostelAddress: string | null;
            hostelRoomNumber: string | null;
            bloodGroup: string | null;
            medicalConditions: string | null;
            allergies: string | null;
            disability: string | null;
        } | null;
        collegeAdmin: ({
            college: {
                id: string;
                email: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                code: string;
                address: string | null;
                state: string | null;
                district: string | null;
                principal: string | null;
                phone: string | null;
                status: import("@prisma/client").$Enums.CollegeStatus;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            phone: string | null;
            collegeId: string;
            userId: string;
        }) | null;
    } | null>;
    private issueTokens;
}
