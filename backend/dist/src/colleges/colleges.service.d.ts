import { PrismaService } from '../prisma/prisma.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto';
import { QueryCollegesDto } from './dto/query-colleges.dto';
import { Paginated } from '../common/dto/pagination.dto';
export declare class CollegesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findAll(query: QueryCollegesDto): Promise<Paginated<unknown>>;
    findPublicActive(): Promise<{
        id: string;
        name: string;
        code: string;
        state: string | null;
        district: string | null;
    }[]>;
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
