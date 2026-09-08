import api from './api';

export interface OrgDashboard {
  todayReports: number;
  emergencyReports: number;
  pending: number;
  investigating: number;
  resolved: number;
  byCategory: { category: string; count: number }[];
  byMonth: { month: string; count: number }[];
  byDepartment: { department: string; count: number }[];
}

export interface SuperAdminDashboard {
  totalOrganizations?: number;
  totalMembers?: number;
  totalStaff?: number;
  totalColleges?: number;
  totalStudents?: number;
  totalCollegeAdmins?: number;
  totalReports: number;
  emergencyReports: number;
  resolvedReports: number;
  byState: { state: string; count: number }[];
  byOrganization?: { organizationId: string; organization: string; count: number }[];
  byCollege?: { collegeId: string; college: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byMonth: { month: string; count: number }[];
}

export const getOrgDashboard = async () => {
  const { data } = await api.get<OrgDashboard>('/dashboard/staff');
  return data;
};

export const getSuperAdminDashboard = async () => {
  const { data } = await api.get<SuperAdminDashboard>('/dashboard/support');
  return data;
};
