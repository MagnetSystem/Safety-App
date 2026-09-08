import { IsBoolean, IsDateString, IsInt, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateMemberProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  studentNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsUUID()
  assignedDepartmentId?: string | null;

  @IsOptional()
  @IsObject()
  profile?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsString()
  semester?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsBoolean()
  isHosteler?: boolean;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  hostelAddress?: string;

  @IsOptional()
  @IsString()
  hostelRoomNumber?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  disability?: string;
}
