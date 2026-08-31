import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
export declare class SearchService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    search(user: AuthenticatedUser, q: string): Promise<{
        students: {
            id: string;
            name: string;
            user: {
                email: string;
            };
            college: {
                id: string;
                name: string;
            };
            studentNumber: string | null;
        }[];
        complaints: {
            id: string;
            code: string;
            status: import("@prisma/client").$Enums.ComplaintStatus;
            collegeId: string;
            type: import("@prisma/client").$Enums.ReportType;
            category: import("@prisma/client").$Enums.IncidentCategory;
        }[];
        colleges: never[] | {
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
        }[];
    }>;
}
