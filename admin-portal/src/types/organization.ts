export interface Member {
  id: string;
  name: string;
  memberNumber?: string | null;
  studentNumber?: string | null;
  department: string | null;
  course: string | null;
  year: number | null;
  section: string | null;
  isHosteler: boolean | null;
  mobile: string | null;
  bloodGroup: string | null;
  organizationId?: string | null;
  collegeId?: string;
  organization?: { id: string; name: string; code: string };
  college?: { id: string; name: string; code: string };
  user?: { id: string; email: string; isActive: boolean; createdAt: string };
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  industry?: string;
  joinCode?: string;
  organizationType?: { id: string; slug: string; label: string } | null;
  address: string | null;
  state: string | null;
  district: string | null;
  contactName?: string | null;
  principal?: string | null;
  phone: string | null;
  email: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  settings?: Record<string, unknown> | null;
  createdAt: string;
  _count?: { members?: number; staff?: number; incidents?: number; students?: number; admins?: number; complaints?: number };
}

export type OrgRole = 'OWNER' | 'ADMIN' | 'STAFF';

export interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  orgRole?: OrgRole;
  organizationId?: string;
  collegeId?: string;
  organization?: { id: string; name: string; code: string };
  college?: { id: string; name: string; code: string };
  user: { id: string; email: string; isActive: boolean; createdAt: string; role?: string };
  departments?: { department: { id: string; name: string; slug: string } }[];
}

/** @deprecated Use Member */
export type Student = Member;
/** @deprecated Use Organization */
export type College = Organization;
/** @deprecated Use StaffMember */
export type CollegeAdmin = StaffMember;
