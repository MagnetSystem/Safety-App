import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryStaffDto } from './dto/query-staff.dto';

@Controller(['staff', 'college-admins'])
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.SUPPORT)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Audit({ action: 'STAFF_CREATED', entityType: 'OrgStaff' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStaffDto) {
    return this.staffService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryStaffDto) {
    return this.staffService.findAll(user, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @Audit({ action: 'STAFF_UPDATED', entityType: 'OrgStaff' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this.staffService.update(id, dto);
  }

  @Patch(':id/activate')
  @Audit({ action: 'STAFF_ACTIVATED', entityType: 'OrgStaff' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.updateStatus(id, true);
  }

  @Patch(':id/deactivate')
  @Audit({ action: 'STAFF_DEACTIVATED', entityType: 'OrgStaff' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.updateStatus(id, false);
  }

  @Patch(':id/reset-password')
  @Audit({ action: 'STAFF_PASSWORD_RESET', entityType: 'OrgStaff' })
  resetPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordDto) {
    return this.staffService.resetPassword(id, dto);
  }
}
