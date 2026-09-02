import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterPushTokenDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;
}

export class RemovePushTokenDto {
  @IsString()
  @MinLength(1)
  token!: string;
}
