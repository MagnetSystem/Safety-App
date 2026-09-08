import { IsString, MinLength } from 'class-validator';

export class ResetOwnerPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
