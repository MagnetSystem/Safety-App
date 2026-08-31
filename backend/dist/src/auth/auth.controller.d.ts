import type { AuthenticatedUser } from './types/jwt-payload.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { RegisterCollegeDto } from './dto/register-college.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            collegeId: string | null;
        };
    }>;
    me(user: AuthenticatedUser): Promise<{
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
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
}
