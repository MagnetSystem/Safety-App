import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { Paginated } from '../common/dto/pagination.dto';
export declare class StudentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(requester: AuthenticatedUser, query: QueryStudentsDto): Promise<Paginated<unknown>>;
    findOneForRequester(requester: AuthenticatedUser, id: string): Promise<{
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
    findMe(userId: string): Promise<{
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
    updateMe(userId: string, dto: UpdateStudentProfileDto): Promise<{
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
