import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    forStudent(user: AuthenticatedUser): Promise<{
        totalReports: number;
        emergencyReports: number;
        openReports: number;
        resolvedReports: number;
    }>;
    forCollegeAdmin(user: AuthenticatedUser): Promise<{
        todayReports: number;
        emergencyReports: number;
        pending: number;
        investigating: number;
        resolved: number;
        byCategory: {
            category: import("@prisma/client").$Enums.IncidentCategory;
            count: number;
        }[];
        byMonth: {
            month: string;
            count: number;
        }[];
        byDepartment: {
            department: string;
            count: number;
        }[];
    }>;
    forSuperAdmin(): Promise<{
        totalColleges: number;
        totalStudents: number;
        totalCollegeAdmins: number;
        totalReports: number;
        emergencyReports: number;
        resolvedReports: number;
        byState: {
            state: string;
            count: number;
        }[];
        byCollege: {
            collegeId: string;
            college: string;
            count: number;
        }[];
        byCategory: {
            category: import("@prisma/client").$Enums.IncidentCategory;
            count: number;
        }[];
        byMonth: {
            month: string;
            count: number;
        }[];
    }>;
}
