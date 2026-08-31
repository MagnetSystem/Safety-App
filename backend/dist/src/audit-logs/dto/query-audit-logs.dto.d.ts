import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryAuditLogsDto extends PaginationDto {
    collegeId?: string;
    action?: string;
    entityType?: string;
}
