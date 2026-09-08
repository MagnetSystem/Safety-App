import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsString, MinLength } from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { GuardiansService } from './guardians.service';

class AcceptGuardianDto {
  @IsString()
  @MinLength(4)
  code!: string;
}

@Controller('guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Post('invite')
  @Roles(UserRole.MEMBER)
  @Audit({ action: 'GUARDIAN_INVITED', entityType: 'GuardianLink' })
  invite(@CurrentUser() user: AuthenticatedUser) {
    return this.guardiansService.invite(user.id);
  }

  @Get('mine')
  @Roles(UserRole.MEMBER)
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.guardiansService.listMine(user.id);
  }

  @Get('wards')
  @Roles(UserRole.GUARDIAN, UserRole.MEMBER)
  listWards(@CurrentUser() user: AuthenticatedUser) {
    return this.guardiansService.listWards(user.id);
  }

  @Post('accept')
  @Audit({ action: 'GUARDIAN_ACCEPTED', entityType: 'GuardianLink' })
  accept(@CurrentUser() user: AuthenticatedUser, @Body() dto: AcceptGuardianDto) {
    return this.guardiansService.accept(user.id, dto.code);
  }

  @Delete(':id')
  @Roles(UserRole.MEMBER)
  @Audit({ action: 'GUARDIAN_REVOKED', entityType: 'GuardianLink' })
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.guardiansService.revoke(user.id, id);
  }
}
