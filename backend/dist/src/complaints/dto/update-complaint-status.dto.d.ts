import { ComplaintStatus } from '@prisma/client';
export declare class UpdateComplaintStatusDto {
    status: ComplaintStatus;
    note?: string;
    resolutionReport?: string;
}
