import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OnboardOrganizationDto } from './dto/onboard-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UpdateOrganizationStatusDto } from './dto/update-organization-status.dto';
import { QueryOrganizationsDto } from './dto/query-organizations.dto';
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto';

@Controller(['organizations', 'colleges'])
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORGANIZATION_CREATED', entityType: 'Organization' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Post('onboard')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'CLIENT_ONBOARDED', entityType: 'Organization' })
  onboard(@Body() dto: OnboardOrganizationDto) {
    return this.organizationsService.onboardClient(dto);
  }

  @Get()
  @Roles(UserRole.SUPPORT)
  findAll(@Query() query: QueryOrganizationsDto) {
    return this.organizationsService.findAll(query);
  }

  @Get('public')
  @Public()
  findPublicActive() {
    return this.organizationsService.findPublicActive();
  }

  @Get('me')
  @Roles(UserRole.STAFF)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.findOne(user.organizationId!);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'ORGANIZATION_UPDATED', entityType: 'Organization' })
  updateMine(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(user.organizationId!, dto);
  }

  @Patch('me/settings')
  @Roles(UserRole.OWNER)
  @Audit({ action: 'ORGANIZATION_SETTINGS_UPDATED', entityType: 'Organization' })
  updateMySettings(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.organizationsService.updateSettings(user.organizationId!, body);
  }

  @Post('me/join-code')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'JOIN_CODE_ROTATED', entityType: 'Organization' })
  rotateJoinCode(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.rotateJoinCode(user.organizationId!);
  }

  @Get(':id')
  @Roles(UserRole.SUPPORT)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORGANIZATION_UPDATED', entityType: 'Organization' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORGANIZATION_STATUS_CHANGED', entityType: 'Organization' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationStatusDto) {
    return this.organizationsService.updateStatus(id, dto);
  }

  @Patch(':id/reset-owner-password')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'OWNER_PASSWORD_RESET', entityType: 'Organization' })
  resetOwnerPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResetOwnerPasswordDto,
  ) {
    return this.organizationsService.resetOwnerPassword(id, body.newPassword);
  }
}
