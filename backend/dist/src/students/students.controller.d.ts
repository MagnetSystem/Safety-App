import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { StudentsService } from './students.service';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    findAll(user: AuthenticatedUser, query: QueryStudentsDto): Promise<import("../common/dto/pagination.dto").Paginated<unknown>>;
    findMe(user: AuthenticatedUser): Promise<{
        user: {
            id: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        };
        college: {
            id: string;
            name: string;
            code: string;
        };
    } & {
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
    }>;
    updateMe(user: AuthenticatedUser, dto: UpdateStudentProfileDto): Promise<{
        user: {
            id: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        };
        college: {
            id: string;
            name: string;
            code: string;
        };
    } & {
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
    }>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        user: {
            id: string;
            email: string;
            isActive: boolean;
            createdAt: Date;
        };
        college: {
            id: string;
            name: string;
            code: string;
        };
    } & {
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
    }>;
}
