export type ReportType = 'EMERGENCY' | 'NORMAL' | 'ANONYMOUS';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INVESTIGATING'
  | 'MORE_INFO_REQUESTED'
  | 'RESOLVED'
  | 'CLOSED';

export type IncidentCategoryEnum =
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

export const CATEGORY_OPTIONS: IncidentCategoryEnum[] = [
  'PHYSICAL_RAGGING',
  'VERBAL_ABUSE',
  'MENTAL_HARASSMENT',
  'THREAT',
  'HOSTEL_RAGGING',
  'CLASSROOM_RAGGING',
  'CYBER_BULLYING',
  'MONEY_EXTORTION',
  'SEXUAL_HARASSMENT',
  'OTHER',
];

export interface TimelineStep {
  id: string;
  status: ComplaintStatus;
  note: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  code: string;
  type: ReportType;
  category: IncidentCategoryEnum;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  location?: string | null;
  incidentDate?: string | null;
  timeline: TimelineStep[];
}

export interface StudentProfile {
  id: string;
  name: string;
  studentNumber: string | null;
  department: string | null;
  course: string | null;
  semester: string | null;
  year: number | null;
  isHosteler: boolean | null;
  mobile: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  medicalConditions: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  college?: { id: string; name: string; code: string };
  user?: { id: string; email: string };
}

export const WORKFLOW_STATUSES: ComplaintStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'INVESTIGATING',
  'MORE_INFO_REQUESTED',
  'RESOLVED',
  'CLOSED',
];

export function statusLabel(status: ComplaintStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

export function categoryLabel(category: IncidentCategoryEnum): string {
  return category
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}
