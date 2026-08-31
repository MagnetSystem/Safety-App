import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { EvidenceService } from './evidence.service';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmEvidenceDto } from './dto/confirm-evidence.dto';
export declare class EvidenceController {
    private readonly evidenceService;
    constructor(evidenceService: EvidenceService);
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
