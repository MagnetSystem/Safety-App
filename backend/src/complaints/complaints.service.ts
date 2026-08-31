import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ComplaintStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { AssignCommitteeDto } from './dto/assign-committee.dto';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { Paginated } from '../common/dto/pagination.dto';
import { maskAnonymousComplaint } from './complaints.util';

const DETAIL_INCLUDE = {
  student: { select: { id: true, name: true, studentNumber: true, mobile: true } },
  college: { select: { id: true, name: true, code: true } },
  evidence: true,
  timeline: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ComplaintInclude;

const LIST_INCLUDE = {
  student: { select: { id: true, name: true, studentNumber: true } },
  college: { select: { id: true, name: true, code: true } },
  _count: { select: { evidence: true } },
} satisfies Prisma.ComplaintInclude;

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateComplaintDto) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw new NotFoundException('Student profile not found');

    const isEmergency = dto.type === 'EMERGENCY';
    const isAnonymous = dto.type === 'ANONYMOUS';
    const code = `CS-${new Date().getFullYear()}-${randomUUID().split('-')[0].toUpperCase()}`;

    const complaint = await this.prisma.complaint.create({
      data: {
        code,
        collegeId: student.collegeId,
        studentId: student.id,
        type: dto.type,
        category: dto.category,
        priority: isEmergency ? 'CRITICAL' : 'NORMAL',
        isAnonymous,
        description: dto.description,
        incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
        location: dto.location,
        suspectedStudents: dto.suspectedStudents,
        witnesses: dto.witnesses,
        gpsLat: isEmergency ? dto.gpsLat : undefined,
        gpsLng: isEmergency ? dto.gpsLng : undefined,
        gpsAccuracy: isEmergency ? dto.gpsAccuracy : undefined,
        deviceInfo: isEmergency ? dto.deviceInfo : undefined,
        timeline: {
          create: { status: 'SUBMITTED', actorId: user.id, note: 'Report submitted' },
        },
      },
      include: DETAIL_INCLUDE,
    });

    await this.notifyOnSubmit(complaint, user.id);

    return maskAnonymousComplaint(complaint);
  }

  private async notifyOnSubmit(
    complaint: Prisma.ComplaintGetPayload<{ include: typeof DETAIL_INCLUDE }>,
    studentUserId: string,
  ) {
    await this.notifications.create({
      userId: studentUserId,
      type: 'REPORT_SUBMITTED',
      title: 'Report submitted',
      body: `Your report ${complaint.code} has been submitted and is being reviewed.`,
      data: { complaintId: complaint.id },
    });

    const admins = await this.prisma.collegeAdmin.findMany({
      where: { collegeId: complaint.collegeId },
      select: { userId: true },
    });

    await this.notifications.createMany(
      admins.map((admin) => ({
        userId: admin.userId,
        type: complaint.priority === 'CRITICAL' ? 'NEW_EMERGENCY_REPORT' : 'NEW_COMPLAINT',
        title: complaint.priority === 'CRITICAL' ? 'New emergency report' : 'New complaint filed',
        body: `${complaint.code} · ${complaint.category.replaceAll('_', ' ')}`,
        data: { complaintId: complaint.id },
      })),
    );
  }

  async findAll(user: AuthenticatedUser, query: QueryComplaintsDto): Promise<Paginated<unknown>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ComplaintWhereInput = {};

    if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) throw new NotFoundException('Student profile not found');
      where.studentId = student.id;
    } else if (user.role === 'COLLEGE_ADMIN') {
      where.collegeId = user.collegeId!;
    } else if (query.collegeId) {
      where.collegeId = query.collegeId;
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.from || query.to) {
      where.createdAt = {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: LIST_INCLUDE,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      items: items.map((item) => maskAnonymousComplaint(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOneForRequester(user: AuthenticatedUser, id: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!complaint) throw new NotFoundException('Complaint not found');
    await this.assertAccess(user, complaint);
    return maskAnonymousComplaint(complaint);
  }

  async getTimeline(user: AuthenticatedUser, id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { timeline: { orderBy: { createdAt: 'asc' } } },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');
    await this.assertAccess(user, complaint);
    return complaint.timeline;
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateComplaintStatusDto) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.collegeId !== user.collegeId) {
      throw new ForbiddenException('This complaint belongs to a different college');
    }

    const updated = await this.prisma.complaint.update({
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

    if (updated.studentId) {
      const student = await this.prisma.student.findUnique({ where: { id: updated.studentId } });
      if (student) await this.notifyStatusChange(student.userId, updated);
    }

    return maskAnonymousComplaint(updated);
  }

  private async notifyStatusChange(
    studentUserId: string,
    complaint: Prisma.ComplaintGetPayload<{ include: typeof DETAIL_INCLUDE }>,
  ) {
    const copy: Record<ComplaintStatus, { title: string; body: string; type: string }> = {
      SUBMITTED: { title: 'Report submitted', body: 'Your report has been submitted.', type: 'REPORT_SUBMITTED' },
      UNDER_REVIEW: { title: 'Report under review', body: `${complaint.code} is now under review.`, type: 'STATUS_CHANGED' },
      INVESTIGATING: { title: 'Investigation started', body: `${complaint.code} is now being investigated.`, type: 'INVESTIGATION_STARTED' },
      MORE_INFO_REQUESTED: { title: 'More information needed', body: `The committee needs more information on ${complaint.code}.`, type: 'MORE_INFO_REQUESTED' },
      RESOLVED: { title: 'Report resolved', body: `${complaint.code} has been resolved.`, type: 'STATUS_CHANGED' },
      CLOSED: { title: 'Report closed', body: `${complaint.code} has been closed.`, type: 'REPORT_CLOSED' },
    };
    const entry = copy[complaint.status];
    await this.notifications.create({
      userId: studentUserId,
      type: entry.type as any,
      title: entry.title,
      body: entry.body,
      data: { complaintId: complaint.id },
    });
  }

  async assignCommittee(user: AuthenticatedUser, id: string, dto: AssignCommitteeDto) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('Complaint not found');
    if (complaint.collegeId !== user.collegeId) {
      throw new ForbiddenException('This complaint belongs to a different college');
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        assignedCommitteeUserIds: dto.userIds,
        timeline: {
          create: {
            status: complaint.status === 'SUBMITTED' ? 'UNDER_REVIEW' : complaint.status,
            note: 'Committee assigned',
            actorId: user.id,
          },
        },
        status: complaint.status === 'SUBMITTED' ? 'UNDER_REVIEW' : complaint.status,
      },
      include: DETAIL_INCLUDE,
    });

    return maskAnonymousComplaint(updated);
  }

  /** Used by the Evidence module to enforce the same access rules on a complaint. */
  async assertAccess(
    user: AuthenticatedUser,
    complaint: { collegeId: string; studentId: string | null },
  ) {
    if (user.role === 'SUPER_ADMIN') return;
    if (user.role === 'COLLEGE_ADMIN') {
      if (complaint.collegeId !== user.collegeId) {
        throw new ForbiddenException('This complaint belongs to a different college');
      }
      return;
    }
    // STUDENT
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    if (!student || complaint.studentId !== student.id) {
      throw new ForbiddenException('You do not have access to this complaint');
    }
  }
}
