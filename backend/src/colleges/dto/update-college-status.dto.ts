import { IsEnum } from 'class-validator';
import { CollegeStatus } from '@prisma/client';

export class UpdateCollegeStatusDto {
  @IsEnum(CollegeStatus)
  status!: CollegeStatus;
}
