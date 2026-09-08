import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CollegeAdminsService } from './college-admins.service';
import { CreateCollegeAdminDto } from './dto/create-college-admin.dto';
import { UpdateCollegeAdminDto } from './dto/update-college-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryCollegeAdminsDto } from './dto/query-college-admins.dto';

@Controller(['staff', 'college-admins'])
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
export class CollegeAdminsController {
  constructor(private readonly collegeAdminsService: CollegeAdminsService) {}

  @Post()
  @Audit({ action: 'STAFF_CREATED', entityType: 'OrgStaff' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCollegeAdminDto) {
    return this.collegeAdminsService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryCollegeAdminsDto) {
    return this.collegeAdminsService.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegeAdminsService.findOne(id);
  }

  @Patch(':id')
  @Audit({ action: 'STAFF_UPDATED', entityType: 'OrgStaff' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollegeAdminDto) {
    return this.collegeAdminsService.update(id, dto);
  }

  @Patch(':id/activate')
  @Audit({ action: 'STAFF_ACTIVATED', entityType: 'OrgStaff' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegeAdminsService.updateStatus(id, true);
  }

  @Patch(':id/deactivate')
  @Audit({ action: 'STAFF_DEACTIVATED', entityType: 'OrgStaff' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegeAdminsService.updateStatus(id, false);
  }

  @Patch(':id/reset-password')
  @Audit({ action: 'STAFF_PASSWORD_RESET', entityType: 'OrgStaff' })
  resetPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordDto) {
    return this.collegeAdminsService.resetPassword(id, dto);
  }
}
