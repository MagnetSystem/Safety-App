import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { AssignCommitteeDto } from './dto/assign-committee.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { Paginated } from '../common/dto/pagination.dto';
export declare class ComplaintsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    create(user: AuthenticatedUser, dto: CreateComplaintDto): Promise<any>;
    private notifyOnSubmit;
    findAll(user: AuthenticatedUser, query: QueryComplaintsDto): Promise<Paginated<unknown>>;
    findOneForRequester(user: AuthenticatedUser, id: string): Promise<any>;
    getTimeline(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        note: string | null;
        actorId: string | null;
        complaintId: string;
    }[]>;
    updateStatus(user: AuthenticatedUser, id: string, dto: UpdateComplaintStatusDto): Promise<any>;
    private notifyStatusChange;
    assignCommittee(user: AuthenticatedUser, id: string, dto: AssignCommitteeDto): Promise<any>;
    assertAccess(user: AuthenticatedUser, complaint: {
        collegeId: string;
        studentId: string | null;
    }): Promise<void>;
}
