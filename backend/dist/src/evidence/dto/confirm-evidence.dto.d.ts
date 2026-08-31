import { EvidenceType } from '@prisma/client';
export declare class ConfirmEvidenceDto {
    storagePath: string;
    fileName: string;
    type: EvidenceType;
    mimeType?: string;
    sizeBytes?: number;
}
