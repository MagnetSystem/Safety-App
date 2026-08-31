import api from './api';

export interface CollegeAdminDashboard {
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
  totalColleges: number;
  totalStudents: number;
  totalCollegeAdmins: number;
  totalReports: number;
  emergencyReports: number;
  resolvedReports: number;
  byState: { state: string; count: number }[];
  byCollege: { collegeId: string; college: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byMonth: { month: string; count: number }[];
}

export const getCollegeAdminDashboard = async () => {
  const { data } = await api.get<CollegeAdminDashboard>('/dashboard/college-admin');
  return data;
};

export const getSuperAdminDashboard = async () => {
  const { data } = await api.get<SuperAdminDashboard>('/dashboard/super-admin');
  return data;
};
