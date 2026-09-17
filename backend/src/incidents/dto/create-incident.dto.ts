import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ReportType } from '@prisma/client';

// Anonymous reporting is disabled for now — masking never fully hid the reporter's identity
// (timeline/message/evidence rows still carried their user id). Revisit before re-enabling.
const CREATABLE_REPORT_TYPES = [ReportType.NORMAL, ReportType.EMERGENCY] as const;

export class CreateIncidentDto {
  @IsIn(CREATABLE_REPORT_TYPES)
  type!: ReportType;

  @IsString()
  @MinLength(2)
  category!: string;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  suspectedPeople?: string;

  @IsOptional()
  @IsString()
  suspectedStudents?: string;

  @IsOptional()
  @IsString()
  witnesses?: string;

  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  gpsLng?: number;

  @IsOptional()
  @IsNumber()
  gpsAccuracy?: number;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
