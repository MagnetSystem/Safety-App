import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    student(user: AuthenticatedUser): Promise<{
        totalReports: number;
        emergencyReports: number;
        openReports: number;
        resolvedReports: number;
    }>;
    collegeAdmin(user: AuthenticatedUser): Promise<{
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
    superAdmin(): Promise<{
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
