import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { IncidentCategory, ReportType } from '@prisma/client';

export class CreateComplaintDto {
  @IsEnum(ReportType)
  type!: ReportType;

  @IsEnum(IncidentCategory)
  category!: IncidentCategory;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  suspectedStudents?: string;

  @IsOptional()
  @IsString()
  witnesses?: string;

  // Emergency-only GPS capture
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
