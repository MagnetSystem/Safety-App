import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IncidentStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { AssignCommitteeDto } from './dto/assign-committee.dto';
import { QueryIncidentsDto } from './dto/query-incidents.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Paginated } from '../common/dto/pagination.dto';
import { maskAnonymousIncident } from './incidents.util';
import { canSeeAllOrgCases, isOrgOperator } from '../common/org-roles';
import { parseSettings } from '../common/industry';

const DETAIL_INCLUDE = {
  member: { select: { id: true, name: true, memberNumber: true, mobile: true } },
  organization: { select: { id: true, name: true, code: true } },
  assignedTo: { select: { id: true, email: true, role: true } },
  department: { select: { id: true, name: true, slug: true } },
  evidence: true,
  timeline: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.IncidentInclude;

const LIST_INCLUDE = {
  member: { select: { id: true, name: true, memberNumber: true } },
  organization: { select: { id: true, name: true, code: true } },
  assignedTo: { select: { id: true, email: true } },
  department: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.IncidentInclude;

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateIncidentDto) {
    const member = await this.prisma.member.findUnique({
      where: { userId: user.id },
      include: { organization: true },
    });
    if (!member) throw new NotFoundException('Member profile not found');

    const isEmergency = dto.type === 'EMERGENCY';
    const isAnonymous = dto.type === 'ANONYMOUS';

    if (!member.organizationId && !isEmergency) {
      throw new BadRequestException('Join an organization to file routine reports. Emergency SOS is available without one.');
    }

    if (member.organizationId && member.organization) {
      const settings = parseSettings(member.organization.settings);
      if (!settings.features.reporting && !isEmergency) {
        throw new BadRequestException('Reporting is not enabled for this organization');
      }
    }

    const code = `SP-${new Date().getFullYear()}-${randomUUID().split('-')[0].toUpperCase()}`;
    const settings = member.organization ? parseSettings(member.organization.settings, member.organization.industry) : null;
    const departmentId = isEmergency || !settings?.features.departmentsEnabled
      ? null
      : ((dto as { departmentId?: string }).departmentId ?? member.assignedDepartmentId ?? null);

    const incident = await this.prisma.incident.create({
      data: {
        code,
        organizationId: member.organizationId,
        memberId: member.id,
        departmentId,
        type: dto.type,
        category: dto.category,
        priority: isEmergency ? 'CRITICAL' : 'NORMAL',
        isAnonymous,
        description: dto.description,
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
        location: dto.location,
        suspectedPeople: dto.suspectedPeople ?? dto.suspectedStudents,
        witnesses: dto.witnesses,
        gpsLat: dto.gpsLat,
        gpsLng: dto.gpsLng,
        gpsAccuracy: dto.gpsAccuracy,
        deviceInfo: dto.deviceInfo,
        timeline: {
          create: { status: 'SUBMITTED', actorId: user.id, note: 'Report submitted' },
        },
      },
      include: DETAIL_INCLUDE,
    });

    await this.notifyOnSubmit(incident, user.id, isEmergency);

    return maskAnonymousIncident(incident);
  }

  private async notifyOnSubmit(
    incident: Prisma.IncidentGetPayload<{ include: typeof DETAIL_INCLUDE }>,
    memberUserId: string,
    isEmergency: boolean,
  ) {
    await this.notifications.create({
      userId: memberUserId,
      type: 'REPORT_SUBMITTED',
      title: isEmergency ? 'Emergency SOS sent' : 'Report submitted',
      body: isEmergency
        ? `Help is on the way. Your alert ${incident.code} was sent.`
        : `Your report ${incident.code} has been submitted and is being reviewed.`,
      data: { incidentId: incident.id, complaintId: incident.id },
    });

    if (incident.organizationId) {
      const staffWhere: Prisma.OrgStaffWhereInput = incident.departmentId && !isEmergency
        ? {
            organizationId: incident.organizationId,
            OR: [
              { orgRole: { in: ['OWNER', 'ADMIN'] } },
              { departments: { some: { departmentId: incident.departmentId } } },
            ],
          }
        : {
            organizationId: incident.organizationId,
            orgRole: { in: ['OWNER', 'ADMIN'] },
          };
      const staff = await this.prisma.orgStaff.findMany({
        where: staffWhere,
        select: { userId: true },
      });
      await this.notifications.createMany(
        staff.map((row) => ({
          userId: row.userId,
          type: incident.priority === 'CRITICAL' ? 'NEW_EMERGENCY_REPORT' : 'NEW_COMPLAINT',
          title: incident.priority === 'CRITICAL' ? 'New emergency SOS' : 'New incident filed',
          body: `${incident.code} · ${incident.category.replaceAll('_', ' ')}`,
          data: { incidentId: incident.id, complaintId: incident.id },
        })),
      );
    }

    if (isEmergency && incident.memberId) {
      const links = await this.prisma.guardianLink.findMany({
        where: { memberId: incident.memberId, status: 'ACTIVE', guardianUserId: { not: null } },
        select: { guardianUserId: true },
      });
      const memberName = incident.isAnonymous ? 'Your linked member' : (incident.member?.name ?? 'Your linked member');
      const locationBit =
        incident.gpsLat != null && incident.gpsLng != null
          ? ` Last known location: ${incident.gpsLat.toFixed(5)}, ${incident.gpsLng.toFixed(5)}.`
          : '';
      await this.notifications.createMany(
        links
          .filter((link) => link.guardianUserId)
          .map((link) => ({
            userId: link.guardianUserId!,
            type: 'GUARDIAN_EMERGENCY' as const,
            title: 'Emergency SOS',
            body: `${memberName} triggered an emergency alert.${locationBit}`,
            data: {
              incidentId: incident.id,
              gpsLat: incident.gpsLat,
              gpsLng: incident.gpsLng,
            },
          })),
      );
    }
  }

  async findAll(user: AuthenticatedUser, query: QueryIncidentsDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.IncidentWhereInput = {};

    if (user.role === UserRole.MEMBER) {
      let memberId = user.memberId ?? null;
      if (!memberId) {
        const member = await this.prisma.member.findUnique({ where: { userId: user.id } });
        if (!member) throw new NotFoundException('Member profile not found');
        memberId = member.id;
      }
      where.memberId = memberId;
    } else if (user.role === UserRole.GUARDIAN) {
      const links = await this.prisma.guardianLink.findMany({
        where: { guardianUserId: user.id, status: 'ACTIVE' },
        select: { memberId: true },
      });
      where.memberId = { in: links.map((l) => l.memberId) };
      where.type = 'EMERGENCY';
    } else if (user.role === UserRole.STAFF) {
      const deptIds = (
        await this.prisma.departmentStaff.findMany({
          where: { orgStaff: { userId: user.id } },
          select: { departmentId: true },
        })
      ).map((d) => d.departmentId);
      where.organizationId = user.organizationId!;
      where.OR = [
        { assignedToUserId: user.id },
        { type: 'EMERGENCY' },
        ...(deptIds.length ? [{ departmentId: { in: deptIds } }] : []),
      ];
    } else if (isOrgOperator(user.role)) {
      where.organizationId = user.organizationId!;
    } else if (user.role === UserRole.SUPPORT) {
      const orgId = query.organizationId ?? query.collegeId ?? user.organizationId;
      if (!orgId) {
        return { items: [], total: 0, page, pageSize };
      }
      where.organizationId = orgId;
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToUserId && canSeeAllOrgCases(user)) {
      where.assignedToUserId = query.assignedToUserId;
    }
    if ((query as { departmentId?: string }).departmentId && canSeeAllOrgCases(user)) {
      where.departmentId = (query as { departmentId?: string }).departmentId;
    }
    if (query.from || query.to) {
      where.createdAt = {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: LIST_INCLUDE,
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      items: items.map((item) => maskAnonymousIncident(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOneForRequester(user: AuthenticatedUser, id: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.assertAccess(user, incident);
    return maskAnonymousIncident(incident);
  }

  async getTimeline(user: AuthenticatedUser, id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { timeline: { orderBy: { createdAt: 'asc' } } },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.assertAccess(user, incident);
    return incident.timeline;
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateIncidentStatusDto) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      select: { organizationId: true, assignedToUserId: true, member: { select: { userId: true } } },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    this.assertStaffWrite(user, incident);

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.resolutionReport && { resolutionReport: dto.resolutionReport }),
        timeline: {
          create: { status: dto.status, note: dto.note, actorId: user.id },
        },
      },
      include: DETAIL_INCLUDE,
    });

    if (incident.member?.userId) {
      await this.notifyStatusChange(incident.member.userId, updated);
    }

    return maskAnonymousIncident(updated);
  }

  private async notifyStatusChange(
    memberUserId: string,
    incident: Prisma.IncidentGetPayload<{ include: typeof DETAIL_INCLUDE }>,
  ) {
    const copy: Record<IncidentStatus, { title: string; body: string; type: string }> = {
      SUBMITTED: { title: 'Report submitted', body: 'Your report has been submitted.', type: 'REPORT_SUBMITTED' },
      UNDER_REVIEW: { title: 'Report under review', body: `${incident.code} is now under review.`, type: 'STATUS_CHANGED' },
      INVESTIGATING: { title: 'Investigation started', body: `${incident.code} is now being investigated.`, type: 'INVESTIGATION_STARTED' },
      MORE_INFO_REQUESTED: { title: 'More information needed', body: `Staff need more information on ${incident.code}.`, type: 'MORE_INFO_REQUESTED' },
      RESOLVED: { title: 'Report resolved', body: `${incident.code} has been resolved.`, type: 'STATUS_CHANGED' },
      CLOSED: { title: 'Report closed', body: `${incident.code} has been closed.`, type: 'REPORT_CLOSED' },
    };
    const entry = copy[incident.status];
    await this.notifications.create({
      userId: memberUserId,
      type: entry.type as 'STATUS_CHANGED',
      title: entry.title,
      body: entry.body,
      data: { incidentId: incident.id, complaintId: incident.id },
    });
  }

  async assignCommittee(user: AuthenticatedUser, id: string, dto: AssignCommitteeDto) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.organizationId !== user.organizationId && user.role !== UserRole.SUPPORT) {
      throw new ForbiddenException('This incident belongs to a different organization');
    }
    if (user.role === UserRole.STAFF) {
      throw new ForbiddenException('Staff cannot assign cases');
    }

    const assignedToUserId = dto.assignedToUserId ?? dto.userIds?.[0];
    if (!assignedToUserId) throw new BadRequestException('assignedToUserId is required');

    const staff = await this.prisma.orgStaff.findUnique({ where: { userId: assignedToUserId } });
    if (!staff || staff.organizationId !== incident.organizationId) {
      throw new BadRequestException('Assignee must be staff in this organization');
    }

    const nextStatus = incident.status === 'SUBMITTED' ? 'UNDER_REVIEW' : incident.status;
    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        assignedToUserId,
        status: nextStatus,
        timeline: {
          create: {
            status: nextStatus,
            note: 'Assigned to staff',
            actorId: user.id,
          },
        },
      },
      include: DETAIL_INCLUDE,
    });

    await this.notifications.create({
      userId: assignedToUserId,
      type: 'NEW_COMPLAINT',
      title: 'Case assigned to you',
      body: `${updated.code} was assigned to you.`,
      data: { incidentId: updated.id, complaintId: updated.id },
    });

    return maskAnonymousIncident(updated);
  }

  async listMessages(user: AuthenticatedUser, id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      select: { organizationId: true, memberId: true, assignedToUserId: true, type: true },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.assertAccess(user, incident);

    return this.prisma.incidentMessage.findMany({
      where: { incidentId: id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, body: true, authorRole: true, authorId: true, createdAt: true },
    });
  }

  async addMessage(user: AuthenticatedUser, id: string, dto: CreateMessageDto) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      select: {
        organizationId: true,
        memberId: true,
        assignedToUserId: true,
        type: true,
        code: true,
        member: { select: { userId: true } },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.assertAccess(user, incident);

    const message = await this.prisma.incidentMessage.create({
      data: {
        incidentId: id,
        authorId: user.id,
        authorRole: user.role,
        body: dto.body,
      },
      select: { id: true, body: true, authorRole: true, authorId: true, createdAt: true },
    });

    if (user.role === UserRole.MEMBER) {
      const recipients = await this.staffRecipientIds(incident);
      await this.notifications.createMany(
        recipients.map((userId) => ({
          userId,
          type: 'NEW_MESSAGE' as const,
          title: 'New reply from member',
          body: `${incident.code}: ${dto.body.slice(0, 80)}`,
          data: { incidentId: id, complaintId: id },
        })),
      );
    } else if (incident.member?.userId) {
      await this.notifications.create({
        userId: incident.member.userId,
        type: 'NEW_MESSAGE',
        title: 'Message from staff',
        body: `${incident.code}: ${dto.body.slice(0, 80)}`,
        data: { incidentId: id, complaintId: id },
      });
    }

    return message;
  }

  private async staffRecipientIds(incident: { organizationId: string | null; assignedToUserId: string | null }) {
    if (incident.assignedToUserId) return [incident.assignedToUserId];
    if (!incident.organizationId) return [];
    const staff = await this.prisma.orgStaff.findMany({
      where: { organizationId: incident.organizationId, orgRole: { in: ['OWNER', 'ADMIN'] } },
      select: { userId: true },
    });
    return staff.map((s) => s.userId);
  }

  async assertAccess(
    user: AuthenticatedUser,
    incident: { organizationId: string | null; memberId: string | null; assignedToUserId?: string | null; type?: string },
  ) {
    if (user.role === UserRole.SUPPORT) return;

    if (user.role === UserRole.STAFF) {
      if (incident.organizationId !== user.organizationId || incident.assignedToUserId !== user.id) {
        throw new ForbiddenException('You do not have access to this incident');
      }
      return;
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER) {
      if (incident.organizationId !== user.organizationId) {
        throw new ForbiddenException('This incident belongs to a different organization');
      }
      return;
    }

    if (user.role === UserRole.GUARDIAN) {
      if (incident.type !== 'EMERGENCY' || !incident.memberId) {
        throw new ForbiddenException('Guardians are only notified of emergencies');
      }
      const link = await this.prisma.guardianLink.findFirst({
        where: { guardianUserId: user.id, memberId: incident.memberId, status: 'ACTIVE' },
      });
      if (!link) throw new ForbiddenException('You do not have access to this incident');
      return;
    }

    let memberId = user.memberId ?? null;
    if (!memberId) {
      const member = await this.prisma.member.findUnique({ where: { userId: user.id } });
      if (!member) throw new NotFoundException('Member profile not found');
      memberId = member.id;
    }
    if (incident.memberId !== memberId) {
      throw new ForbiddenException('You do not have access to this incident');
    }
  }

  private assertStaffWrite(
    user: AuthenticatedUser,
    incident: { organizationId: string | null; assignedToUserId: string | null },
  ) {
    if (user.role === UserRole.SUPPORT) return;
    if (user.role === UserRole.STAFF) {
      if (incident.organizationId !== user.organizationId || incident.assignedToUserId !== user.id) {
        throw new ForbiddenException('You can only update cases assigned to you');
      }
      return;
    }
    if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER) {
      if (incident.organizationId !== user.organizationId) {
        throw new ForbiddenException('This incident belongs to a different organization');
      }
      return;
    }
    throw new ForbiddenException('You cannot update this incident');
  }
}
