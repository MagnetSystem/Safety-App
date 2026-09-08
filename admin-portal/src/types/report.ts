export type ReportType = 'EMERGENCY' | 'NORMAL' | 'ANONYMOUS';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INVESTIGATING'
  | 'MORE_INFO_REQUESTED'
  | 'RESOLVED'
  | 'CLOSED';

export type ComplaintPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export type IncidentCategory =
  | 'PHYSICAL_RAGGING'
  | 'VERBAL_ABUSE'
  | 'MENTAL_HARASSMENT'
  | 'THREAT'
  | 'HOSTEL_RAGGING'
  | 'CLASSROOM_RAGGING'
  | 'CYBER_BULLYING'
  | 'MONEY_EXTORTION'
  | 'SEXUAL_HARASSMENT'
  | 'OTHER';

export type EvidenceType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export interface TimelineEntry {
  id: string;
  status: ComplaintStatus;
  note: string | null;
  actorId: string | null;
  createdAt: string;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string;
  downloadUrl?: string;
}

export interface Report {
  id: string;
  code: string;
  type: ReportType;
  category: IncidentCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  description: string;
  location: string | null;
  incidentDate: string | null;
  suspectedStudents: string | null;
  witnesses: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  isAnonymous: boolean;
  reporterLabel: string | null;
  assignedCommitteeUserIds: string[];
  collegeId: string;
  college?: { id: string; name: string; code: string };
  student?: { id: string; name: string; studentNumber: string | null; mobile?: string | null } | null;
  resolutionReport: string | null;
  evidence?: Evidence[];
  timeline?: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
