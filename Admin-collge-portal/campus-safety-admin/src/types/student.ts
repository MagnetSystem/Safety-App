export interface Student {
  id: string;
  name: string;
  studentNumber: string | null;
  department: string | null;
  course: string | null;
  year: number | null;
  section: string | null;
  isHosteler: boolean | null;
  mobile: string | null;
  bloodGroup: string | null;
  collegeId: string;
  college?: { id: string; name: string; code: string };
  user?: { id: string; email: string; isActive: boolean; createdAt: string };
}

export interface College {
  id: string;
  name: string;
  code: string;
  address: string | null;
  state: string | null;
  district: string | null;
  principal: string | null;
  phone: string | null;
  email: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  _count?: { students: number; admins: number; complaints: number };
}

export interface CollegeAdmin {
  id: string;
  name: string;
  phone: string | null;
  collegeId: string;
  college?: { id: string; name: string; code: string };
  user: { id: string; email: string; isActive: boolean; createdAt: string };
}
