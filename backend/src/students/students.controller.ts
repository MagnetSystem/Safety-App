import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { StudentsService } from './students.service';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IsArray, IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class JoinOrganizationDto {
  @IsString()
  joinCode!: string;
}

class BulkMemberRowDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  memberNumber?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsEmail()
  guardianEmail?: string;
}

class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMemberRowDto)
  rows!: BulkMemberRowDto[];
}

@Controller(['members', 'students'])
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(user, query);
  }

  @Get('me')
  @Roles(UserRole.MEMBER)
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.findMe(user.id);
  }

  @Patch('me')
  @Roles(UserRole.MEMBER)
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateMe(user.id, dto);
  }

  @Post('me/join')
  @Roles(UserRole.MEMBER)
  @Audit({ action: 'MEMBER_JOINED_ORG', entityType: 'Member' })
  join(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinOrganizationDto) {
    return this.studentsService.joinOrganization(user.id, dto.joinCode);
  }

  @Get('me/export')
  @Roles(UserRole.MEMBER)
  @Audit({ action: 'MEMBER_DATA_EXPORTED', entityType: 'Member' })
  exportMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.exportMe(user.id);
  }

  @Delete('me')
  @Roles(UserRole.MEMBER)
  @Audit({ action: 'MEMBER_ACCOUNT_DELETED', entityType: 'User' })
  deleteMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.deleteMe(user.id);
  }

  @Post('import')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'MEMBERS_BULK_IMPORTED', entityType: 'Member' })
  bulkImport(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkImportDto) {
    return this.studentsService.bulkImport(user, dto.rows);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @Audit({ action: 'MEMBER_PROFILE_VIEWED', entityType: 'Member' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOneForRequester(user, id);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.SUPPORT)
  @Audit({ action: 'MEMBER_PASSWORD_RESET', entityType: 'Member' })
  resetPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordDto) {
    return this.studentsService.resetPassword(id, dto);
  }
}
