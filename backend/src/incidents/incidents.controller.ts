import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { AssignCommitteeDto } from './dto/assign-committee.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller(['incidents', 'complaints'])
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @Roles(UserRole.MEMBER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateIncidentDto) {
    return this.incidentsService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryIncidentsDto) {
    return this.incidentsService.findAll(user, query);
  }

  @Get(':id')
  @Audit({ action: 'INCIDENT_VIEWED', entityType: 'Incident' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.findOneForRequester(user, id);
  }

  @Get(':id/timeline')
  getTimeline(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.getTimeline(user, id);
  }

  @Get(':id/messages')
  listMessages(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.incidentsService.listMessages(user, id);
  }

  @Post(':id/messages')
  @Audit({ action: 'INCIDENT_MESSAGE_ADDED', entityType: 'Incident' })
  addMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.incidentsService.addMessage(user, id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.STAFF)
  @Audit({ action: 'INCIDENT_STATUS_CHANGED', entityType: 'Incident' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentStatusDto,
  ) {
    return this.incidentsService.updateStatus(user, id, dto);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  @Audit({ action: 'INCIDENT_ASSIGNED', entityType: 'Incident' })
  assignCommittee(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCommitteeDto,
  ) {
    return this.incidentsService.assignCommittee(user, id, dto);
  }
}
