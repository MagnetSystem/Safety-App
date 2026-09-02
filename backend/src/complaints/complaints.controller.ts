import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { AssignCommitteeDto } from './dto/assign-committee.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryComplaintsDto) {
    return this.complaintsService.findAll(user, query);
  }

  @Get(':id')
  @Audit({ action: 'COMPLAINT_VIEWED', entityType: 'Complaint' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.complaintsService.findOneForRequester(user, id);
  }

  @Get(':id/timeline')
  getTimeline(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.complaintsService.getTimeline(user, id);
  }

  @Get(':id/messages')
  listMessages(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.complaintsService.listMessages(user, id);
  }

  @Post(':id/messages')
  @Audit({ action: 'COMPLAINT_MESSAGE_ADDED', entityType: 'Complaint' })
  addMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.complaintsService.addMessage(user, id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.COLLEGE_ADMIN)
  @Audit({ action: 'COMPLAINT_STATUS_CHANGED', entityType: 'Complaint' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplaintStatusDto,
  ) {
    return this.complaintsService.updateStatus(user, id, dto);
  }

  @Patch(':id/assign')
  @Roles(UserRole.COLLEGE_ADMIN)
  @Audit({ action: 'COMPLAINT_COMMITTEE_ASSIGNED', entityType: 'Complaint' })
  assignCommittee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCommitteeDto,
  ) {
    return this.complaintsService.assignCommittee(user, id, dto);
  }
}
