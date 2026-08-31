import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CollegesService } from './colleges.service';
import { CreateCollegeDto } from './dto/create-college.dto';
import { UpdateCollegeDto } from './dto/update-college.dto';
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto';
import { QueryCollegesDto } from './dto/query-colleges.dto';

@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @Audit({ action: 'COLLEGE_CREATED', entityType: 'College' })
  create(@Body() dto: CreateCollegeDto) {
    return this.collegesService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(@Query() query: QueryCollegesDto) {
    return this.collegesService.findAll(query);
  }

  /**
   * Public, unauthenticated list of active colleges (id/name/code only) so the
   * student app can offer a college picker during self-registration.
   */
  @Get('public')
  @Public()
  findPublicActive() {
    return this.collegesService.findPublicActive();
  }

  /** College Admin's view of their own college. */
  @Get('me')
  @Roles(UserRole.COLLEGE_ADMIN)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.collegesService.findOne(user.collegeId!);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.collegesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @Audit({ action: 'COLLEGE_UPDATED', entityType: 'College' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollegeDto) {
    return this.collegesService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  @Audit({ action: 'COLLEGE_STATUS_CHANGED', entityType: 'College' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCollegeStatusDto) {
    return this.collegesService.updateStatus(id, dto);
  }
}
