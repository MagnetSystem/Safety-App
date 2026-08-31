import { ComplaintPriority, ComplaintStatus, IncidentCategory, ReportType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryComplaintsDto extends PaginationDto {
    status?: ComplaintStatus;
    type?: ReportType;
    category?: IncidentCategory;
    priority?: ComplaintPriority;
    collegeId?: string;
    from?: string;
    to?: string;
}
