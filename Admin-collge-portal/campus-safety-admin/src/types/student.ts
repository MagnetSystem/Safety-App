export interface Student {
  id: string;
  name: string;
  memberNumber?: string | null;
  studentNumber: string | null;
  department: string | null;
  course: string | null;
  year: number | null;
  section: string | null;
  isHosteler: boolean | null;
  mobile: string | null;
  bloodGroup: string | null;
  organizationId?: string | null;
  collegeId: string;
  organization?: { id: string; name: string; code: string };
  college?: { id: string; name: string; code: string };
  user?: { id: string; email: string; isActive: boolean; createdAt: string };
}

export interface College {
  id: string;
  name: string;
  code: string;
  industry?: string;
  joinCode?: string;
  organizationType?: { id: string; slug: string; label: string } | null;
  address: string | null;
  state: string | null;
  district: string | null;
  principal: string | null;
  phone: string | null;
  email: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  _count?: { students?: number; admins?: number; complaints?: number; members?: number; staff?: number; incidents?: number };
}

export interface CollegeAdmin {
  id: string;
  name: string;
  phone: string | null;
  collegeId: string;
  college?: { id: string; name: string; code: string };
  user: { id: string; email: string; isActive: boolean; createdAt: string };
}
