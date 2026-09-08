import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterMemberDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  /** Optional. Standalone members can use SOS + guardians without joining an org. */
  @IsOptional()
  @IsString()
  joinCode?: string;

  @IsOptional()
  @IsString()
  mobile?: string;
}
