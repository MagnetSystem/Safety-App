import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class QueryStudentsDto extends PaginationDto {
    search?: string;
    collegeId?: string;
}
