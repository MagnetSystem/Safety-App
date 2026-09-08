import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { DepartmentsService } from './departments.service';

class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class AssignStaffDto {
  @IsUUID()
  orgStaffId!: string;
}

@Controller()
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get('departments')
  @Roles(UserRole.STAFF, UserRole.MEMBER)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.departments.list(this.departments.assertOrg(user));
  }

  @Post('departments')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'DEPARTMENT_CREATED', entityType: 'Department' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDepartmentDto) {
    return this.departments.create(this.departments.assertOrg(user), dto);
  }

  @Patch('departments/:id')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'DEPARTMENT_UPDATED', entityType: 'Department' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departments.update(this.departments.assertOrg(user), id, dto);
  }

  @Delete('departments/:id')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'DEPARTMENT_DELETED', entityType: 'Department' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.departments.remove(this.departments.assertOrg(user), id);
  }

  @Get('departments/:id/staff')
  @Roles(UserRole.ADMIN)
  listStaff(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.departments.listStaff(this.departments.assertOrg(user), id);
  }

  @Post('departments/:id/staff')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'DEPARTMENT_STAFF_ADDED', entityType: 'Department' })
  assignStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignStaffDto,
  ) {
    return this.departments.assignStaff(this.departments.assertOrg(user), id, dto.orgStaffId);
  }

  @Delete('departments/:id/staff/:orgStaffId')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'DEPARTMENT_STAFF_REMOVED', entityType: 'Department' })
  removeStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('orgStaffId', ParseUUIDPipe) orgStaffId: string,
  ) {
    return this.departments.removeStaff(this.departments.assertOrg(user), id, orgStaffId);
  }
}
