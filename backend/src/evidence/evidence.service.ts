import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { StorageService } from './storage.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmEvidenceDto } from './dto/confirm-evidence.dto';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly incidents: IncidentsService,
  ) {}

  private async getIncidentWithAccess(user: AuthenticatedUser, incidentId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.incidents.assertAccess(user, incident);
    return incident;
  }

  async requestUploadUrl(user: AuthenticatedUser, incidentId: string, dto: RequestUploadUrlDto) {
    await this.getIncidentWithAccess(user, incidentId);
    const storagePath = `${incidentId}/${randomUUID()}-${dto.fileName}`;
    const signed = await this.storage.createSignedUploadUrl(storagePath);
    return { uploadUrl: signed.signedUrl, token: signed.token, storagePath };
  }

  async confirmUpload(user: AuthenticatedUser, incidentId: string, dto: ConfirmEvidenceDto) {
    const incident = await this.getIncidentWithAccess(user, incidentId);

    const evidence = await this.prisma.incidentEvidence.create({
      data: {
        incidentId,
        type: dto.type,
        storagePath: dto.storagePath,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        uploadedById: user.id,
      },
    });

    if (incident.organizationId && user.role === UserRole.MEMBER) {
      const staff = await this.prisma.orgStaff.findMany({
        where: {
          organizationId: incident.organizationId,
          orgRole: { in: ['OWNER', 'ADMIN'] },
        },
        select: { userId: true },
      });
      await this.notifications.createMany(
        staff.map((row) => ({
          userId: row.userId,
          type: 'NEW_EVIDENCE_UPLOADED',
          title: 'New evidence uploaded',
          body: `New evidence added to ${incident.code}`,
          data: { incidentId, evidenceId: evidence.id, complaintId: incidentId },
        })),
      );
    }

    return evidence;
  }

  async list(user: AuthenticatedUser, incidentId: string) {
    await this.getIncidentWithAccess(user, incidentId);
    const rows = await this.prisma.incidentEvidence.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        downloadUrl: await this.storage.createSignedDownloadUrl(row.storagePath),
      })),
    );
  }
}
