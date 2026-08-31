import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryCollegeAdminsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  collegeId?: string;
}
