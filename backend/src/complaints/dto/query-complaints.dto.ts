import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ComplaintPriority, ComplaintStatus, IncidentCategory, ReportType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryComplaintsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsEnum(IncidentCategory)
  category?: IncidentCategory;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  /** Super Admin only — College Admins are always scoped to their own college. */
  @IsOptional()
  @IsUUID()
  collegeId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
