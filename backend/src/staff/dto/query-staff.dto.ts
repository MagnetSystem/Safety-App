import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryStaffDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  collegeId?: string;
}
