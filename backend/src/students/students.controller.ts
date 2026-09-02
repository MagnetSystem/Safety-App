import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { StudentsService } from './students.service';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN)
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryStudentsDto) {
    return this.studentsService.findAll(user, query);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.findMe(user.id);
  }

  @Patch('me')
  @Roles(UserRole.STUDENT)
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateMe(user.id, dto);
  }

  @Get('me/export')
  @Roles(UserRole.STUDENT)
  @Audit({ action: 'STUDENT_DATA_EXPORTED', entityType: 'Student' })
  exportMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.exportMe(user.id);
  }

  @Delete('me')
  @Roles(UserRole.STUDENT)
  @Audit({ action: 'STUDENT_ACCOUNT_DELETED', entityType: 'User' })
  deleteMe(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.deleteMe(user.id);
  }

  @Get(':id')
  @Roles(UserRole.COLLEGE_ADMIN, UserRole.SUPER_ADMIN)
  @Audit({ action: 'STUDENT_PROFILE_VIEWED', entityType: 'Student' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.studentsService.findOneForRequester(user, id);
  }
}
