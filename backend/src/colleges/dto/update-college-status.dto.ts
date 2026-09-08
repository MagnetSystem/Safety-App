import { IsEnum } from 'class-validator';
import { OrganizationStatus } from '@prisma/client';

export class UpdateCollegeStatusDto {
  @IsEnum(OrganizationStatus)
  status!: OrganizationStatus;
}
