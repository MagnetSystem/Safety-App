import { ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

export class AssignCommitteeDto {
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  /** @deprecated Use assignedToUserId. First entry is used. */
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds?: string[];
}
