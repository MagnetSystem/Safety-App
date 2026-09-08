import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IncidentPriority, IncidentStatus, ReportType } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryIncidentsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(IncidentPriority)
  priority?: IncidentPriority;

  @IsOptional()
  @IsUUID()
  collegeId?: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
