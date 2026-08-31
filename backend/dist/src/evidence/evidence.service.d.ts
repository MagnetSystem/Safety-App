import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { StorageService } from './storage.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmEvidenceDto } from './dto/confirm-evidence.dto';
export declare class EvidenceService {
    private readonly prisma;
    private readonly storage;
    private readonly notifications;
    constructor(prisma: PrismaService, storage: StorageService, notifications: NotificationsService);
    private getComplaintWithAccess;
    requestUploadUrl(user: AuthenticatedUser, complaintId: string, dto: RequestUploadUrlDto): Promise<{
        uploadUrl: string;
        token: string;
        storagePath: string;
    }>;
    confirmUpload(user: AuthenticatedUser, complaintId: string, dto: ConfirmEvidenceDto): Promise<{
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.EvidenceType;
        complaintId: string;
        storagePath: string;
        fileName: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedById: string | null;
    }>;
    list(user: AuthenticatedUser, complaintId: string): Promise<{
        downloadUrl: string;
        id: string;
        createdAt: Date;
        type: import("@prisma/client").$Enums.EvidenceType;
        complaintId: string;
        storagePath: string;
        fileName: string;
        mimeType: string | null;
        sizeBytes: number | null;
        uploadedById: string | null;
    }[]>;
}
