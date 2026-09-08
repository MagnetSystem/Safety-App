import { IsEnum } from 'class-validator';
import { OrganizationStatus } from '@prisma/client';

export class UpdateOrganizationStatusDto {
  @IsEnum(OrganizationStatus)
  status!: OrganizationStatus;
}
