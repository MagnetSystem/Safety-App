import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryStudentsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string; // matches name, studentNumber, email, mobile

  /** Super Admin only — College Admins are always scoped to their own college. */
  @IsOptional()
  @IsUUID()
  collegeId?: string;
}
