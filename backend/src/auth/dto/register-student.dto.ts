import { IsDateString, IsEmail, IsInt, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterStudentDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsUUID()
  collegeId!: string;

  @IsOptional()
  @IsString()
  studentNumber?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;
}
