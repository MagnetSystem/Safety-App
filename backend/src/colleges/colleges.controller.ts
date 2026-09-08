import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CollegesService } from './colleges.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { OnboardOrganizationDto } from './dto/onboard-organization.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto';
import { QueryCollegesDto } from './dto/query-colleges.dto';
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto';

@Controller(['organizations', 'colleges'])
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Post()
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORGANIZATION_CREATED', entityType: 'Organization' })
  create(@Body() dto: CreateCollegeDto) {
    return this.collegesService.create(dto);
  }

  @Post('onboard')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'CLIENT_ONBOARDED', entityType: 'Organization' })
  onboard(@Body() dto: OnboardOrganizationDto) {
    return this.collegesService.onboardClient(dto);
  }

  @Get()
  @Roles(UserRole.SUPPORT)
  findAll(@Query() query: QueryCollegesDto) {
    return this.collegesService.findAll(query);
  }

  @Get('public')
  @Public()
  findPublicActive() {
    return this.collegesService.findPublicActive();
  }

  @Get('me')
  @Roles(UserRole.STAFF)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.collegesService.findOne(user.organizationId!);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'ORGANIZATION_UPDATED', entityType: 'Organization' })
  updateMine(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCollegeDto) {
    return this.collegesService.update(user.organizationId!, dto);
  }

  @Patch('me/settings')
  @Roles(UserRole.OWNER)
  @Audit({ action: 'ORGANIZATION_SETTINGS_UPDATED', entityType: 'Organization' })
  updateMySettings(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.collegesService.updateSettings(user.organizationId!, body);
  }

  @Post('me/join-code')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'JOIN_CODE_ROTATED', entityType: 'Organization' })
  rotateJoinCode(@CurrentUser() user: AuthenticatedUser) {
    return this.collegesService.rotateJoinCode(user.organizationId!);
  }

  @Get(':id')
  @Roles(UserRole.SUPPORT)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORGANIZATION_UPDATED', entityType: 'Organization' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollegeDto) {
    return this.collegesService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'ORGANIZATION_STATUS_CHANGED', entityType: 'Organization' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollegeStatusDto) {
    return this.collegesService.updateStatus(id, dto);
  }

  @Patch(':id/reset-owner-password')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'OWNER_PASSWORD_RESET', entityType: 'Organization' })
  resetOwnerPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResetOwnerPasswordDto,
  ) {
    return this.collegesService.resetOwnerPassword(id, body.newPassword);
  }
}
