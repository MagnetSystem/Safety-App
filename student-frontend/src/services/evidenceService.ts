import { File } from 'expo-file-system';
import api from './api';
import type { EvidenceItem, EvidenceType } from '../types';

export interface LocalAttachment {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  type: EvidenceType;
}

export function evidenceTypeFromMime(mime?: string | null): EvidenceType {
  if (!mime) return 'DOCUMENT';
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (mime.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENT';
}

/**
 * Three-step upload: ask the API for a short-lived signed URL, PUT the bytes
 * straight to storage (the backend never sees the file), then confirm so the
 * evidence row is created and the committee is notified.
 */
export async function uploadEvidence(
  complaintId: string,
  att: LocalAttachment,
): Promise<EvidenceItem> {
  const { data: signed } = await api.post<{
    uploadUrl: string;
    token: string;
    storagePath: string;
  }>(`/complaints/${complaintId}/evidence/upload-url`, {
    fileName: att.name,
    type: att.type,
  });

  const file = new File(att.uri);
  const result = await file.upload(signed.uploadUrl, {
    httpMethod: 'PUT',
    headers: {
      'x-upsert': 'true',
      ...(att.mimeType ? { 'Content-Type': att.mimeType } : {}),
    },
  });
  if (result.status >= 300) {
    throw new Error(`Upload failed (${result.status})`);
  }

  const { data } = await api.post<EvidenceItem>(`/complaints/${complaintId}/evidence`, {
    storagePath: signed.storagePath,
    fileName: att.name,
    type: att.type,
    mimeType: att.mimeType,
    sizeBytes: att.size,
  });
  return data;
}

/** Best-effort: uploads each attachment, returns how many succeeded. */
export async function uploadAllEvidence(
  complaintId: string,
  attachments: LocalAttachment[],
): Promise<{ uploaded: number; failed: number }> {
  let uploaded = 0;
  let failed = 0;
  for (const att of attachments) {
    try {
      await uploadEvidence(complaintId, att);
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }
  return { uploaded, failed };
}

export async function getEvidence(complaintId: string): Promise<EvidenceItem[]> {
  const { data } = await api.get<EvidenceItem[]>(`/complaints/${complaintId}/evidence`);
  return data;
}
