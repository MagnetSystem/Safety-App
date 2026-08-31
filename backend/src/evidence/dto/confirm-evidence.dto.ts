import { IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { EvidenceType } from '@prisma/client';

export class ConfirmEvidenceDto {
  @IsString()
  @MinLength(1)
  storagePath!: string;

  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsEnum(EvidenceType)
  type!: EvidenceType;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  sizeBytes?: number;
}
