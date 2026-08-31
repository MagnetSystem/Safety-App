import { IsOptional, IsString } from 'class-validator';

export class UpdateCollegeAdminDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
