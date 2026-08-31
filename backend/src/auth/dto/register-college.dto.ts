import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterCollegeDto {
  // --- College details ---
  @IsString()
  @IsNotEmpty()
  collegeName: string;

  @IsString()
  @IsNotEmpty()
  collegeCode: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  principal?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  collegeEmail?: string;

  @IsString()
  @IsOptional()
  address?: string;

  // --- Admin account ---
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;

  @IsString()
  @IsOptional()
  adminPhone?: string;
}
