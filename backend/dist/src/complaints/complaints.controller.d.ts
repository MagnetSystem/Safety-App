import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { AssignCommitteeDto } from './dto/assign-committee.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
export declare class ComplaintsController {
    private readonly complaintsService;
    constructor(complaintsService: ComplaintsService);
    create(user: AuthenticatedUser, dto: CreateComplaintDto): Promise<any>;
    findAll(user: AuthenticatedUser, query: QueryComplaintsDto): Promise<import("../common/dto/pagination.dto").Paginated<unknown>>;
    findOne(user: AuthenticatedUser, id: string): Promise<any>;
    getTimeline(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ComplaintStatus;
        note: string | null;
        actorId: string | null;
        complaintId: string;
    }[]>;
    updateStatus(user: AuthenticatedUser, id: string, dto: UpdateComplaintStatusDto): Promise<any>;
    assignCommittee(user: AuthenticatedUser, id: string, dto: AssignCommitteeDto): Promise<any>;
}
