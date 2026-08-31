import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CollegeAdminsService } from './college-admins.service';
import { CreateCollegeAdminDto } from './dto/create-college-admin.dto';
import { UpdateCollegeAdminDto } from './dto/update-college-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { QueryCollegeAdminsDto } from './dto/query-college-admins.dto';

@Controller('college-admins')
@Roles(UserRole.SUPER_ADMIN)
export class CollegeAdminsController {
  constructor(private readonly collegeAdminsService: CollegeAdminsService) {}

  @Post()
  @Audit({ action: 'COLLEGE_ADMIN_CREATED', entityType: 'CollegeAdmin' })
  create(@Body() dto: CreateCollegeAdminDto) {
    return this.collegeAdminsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryCollegeAdminsDto) {
    return this.collegeAdminsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegeAdminsService.findOne(id);
  }

  @Patch(':id')
  @Audit({ action: 'COLLEGE_ADMIN_UPDATED', entityType: 'CollegeAdmin' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollegeAdminDto) {
    return this.collegeAdminsService.update(id, dto);
  }

  @Patch(':id/activate')
  @Audit({ action: 'COLLEGE_ADMIN_ACTIVATED', entityType: 'CollegeAdmin' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegeAdminsService.updateStatus(id, true);
  }

  @Patch(':id/deactivate')
  @Audit({ action: 'COLLEGE_ADMIN_DEACTIVATED', entityType: 'CollegeAdmin' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegeAdminsService.updateStatus(id, false);
  }

  @Patch(':id/reset-password')
  @Audit({ action: 'COLLEGE_ADMIN_PASSWORD_RESET', entityType: 'CollegeAdmin' })
  resetPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordDto) {
    return this.collegeAdminsService.resetPassword(id, dto);
  }
}
