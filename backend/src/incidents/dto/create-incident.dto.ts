import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ReportType } from '@prisma/client';

export class CreateIncidentDto {
  @IsEnum(ReportType)
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
