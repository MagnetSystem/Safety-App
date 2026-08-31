import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(user: AuthenticatedUser, query: SearchQueryDto): Promise<{
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
