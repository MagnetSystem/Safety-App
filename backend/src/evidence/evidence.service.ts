import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { StorageService } from './storage.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmEvidenceDto } from './dto/confirm-evidence.dto';

@Injectable()
export class EvidenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getComplaintWithAccess(user: AuthenticatedUser, complaintId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (user.role === 'COLLEGE_ADMIN' && complaint.collegeId !== user.collegeId) {
      throw new NotFoundException('Complaint not found');
    }
    if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
      if (!student || complaint.studentId !== student.id) {
        throw new NotFoundException('Complaint not found');
      }
    }
    return complaint;
  }

  async requestUploadUrl(user: AuthenticatedUser, complaintId: string, dto: RequestUploadUrlDto) {
    await this.getComplaintWithAccess(user, complaintId);
    const storagePath = `${complaintId}/${randomUUID()}-${dto.fileName}`;
    const signed = await this.storage.createSignedUploadUrl(storagePath);
    return { uploadUrl: signed.signedUrl, token: signed.token, storagePath };
  }

  async confirmUpload(user: AuthenticatedUser, complaintId: string, dto: ConfirmEvidenceDto) {
    const complaint = await this.getComplaintWithAccess(user, complaintId);

    const evidence = await this.prisma.complaintEvidence.create({
      data: {
        complaintId,
        type: dto.type,
        storagePath: dto.storagePath,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        uploadedById: user.id,
      },
    });

    const admins = await this.prisma.collegeAdmin.findMany({
      where: { collegeId: complaint.collegeId },
      select: { userId: true },
    });
    await this.notifications.createMany(
      admins.map((admin) => ({
        userId: admin.userId,
        type: 'NEW_EVIDENCE_UPLOADED',
        title: 'New evidence uploaded',
        body: `New evidence added to ${complaint.code}`,
        data: { complaintId, evidenceId: evidence.id },
      })),
    );

    return evidence;
  }

  async list(user: AuthenticatedUser, complaintId: string) {
    await this.getComplaintWithAccess(user, complaintId);
    const rows = await this.prisma.complaintEvidence.findMany({
      where: { complaintId },
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
