import { PrismaService } from '../prisma/prisma.service';
import { CreateCollegeAdminDto } from './dto/create-college-admin.dto';
import { UpdateCollegeAdminDto } from './dto/update-college-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryCollegeAdminsDto } from './dto/query-college-admins.dto';
import { Paginated } from '../common/dto/pagination.dto';
export declare class CollegeAdminsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCollegeAdminDto): Promise<{
        id: string;
        name: string;
        user: {
            id: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        };
        phone: string | null;
        college: {
            id: string;
            name: string;
            code: string;
        };
        collegeId: string;
    }>;
    findAll(query: QueryCollegeAdminsDto): Promise<Paginated<unknown>>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        user: {
            id: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        };
        phone: string | null;
        college: {
            id: string;
            name: string;
            code: string;
        };
        collegeId: string;
    }>;
    update(id: string, dto: UpdateCollegeAdminDto): Promise<{
        id: string;
        name: string;
        user: {
            id: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        };
        phone: string | null;
        college: {
            id: string;
            name: string;
            code: string;
        };
        collegeId: string;
    }>;
    updateStatus(id: string, isActive: boolean): Promise<{
        id: string;
        name: string;
        user: {
            id: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        };
        phone: string | null;
        college: {
            id: string;
            name: string;
            code: string;
        };
        collegeId: string;
    }>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<{
        success: boolean;
    }>;
}
