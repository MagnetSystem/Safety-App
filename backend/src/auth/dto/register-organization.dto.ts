import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterOrganizationDto {
  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  @IsOptional()
  @IsString()
  organizationCode?: string;

  /** Slug of an OrganizationType, e.g. EDUCATION or a Support-created type. */
  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  @IsOptional()
  organizationEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(8)
  ownerPassword!: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;

  /** Type-specific answers collected during org setup (not member profile). */
  @IsOptional()
  @IsObject()
  setup?: Record<string, string | number | boolean>;
}
