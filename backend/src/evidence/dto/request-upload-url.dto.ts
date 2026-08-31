import { IsEnum, IsString, MinLength } from 'class-validator';
import { EvidenceType } from '@prisma/client';

export class RequestUploadUrlDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsEnum(EvidenceType)
  type!: EvidenceType;
}
