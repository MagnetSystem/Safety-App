import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CollegesService } from './colleges.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto';
import { QueryCollegesDto } from './dto/query-colleges.dto';
export declare class CollegesController {
    private readonly collegesService;
    constructor(collegesService: CollegesService);
    create(dto: CreateCollegeDto): Promise<{
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
    }>;
    findAll(query: QueryCollegesDto): Promise<import("../common/dto/pagination.dto").Paginated<unknown>>;
    findPublicActive(): Promise<{
        id: string;
        name: string;
        code: string;
        state: string | null;
        district: string | null;
    }[]>;
    findMine(user: AuthenticatedUser): Promise<{
        _count: {
            students: number;
            admins: number;
            complaints: number;
        };
    } & {
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
    }>;
    findOne(id: string): Promise<{
        _count: {
            students: number;
            admins: number;
            complaints: number;
        };
    } & {
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
    }>;
    update(id: string, dto: UpdateCollegeDto): Promise<{
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
    }>;
    updateStatus(id: string, dto: UpdateCollegeStatusDto): Promise<{
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
    }>;
}
