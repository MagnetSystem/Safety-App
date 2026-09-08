import api from './api';

export interface StudentDashboard {
  totalReports: number;
  emergencyReports: number;
  openReports: number;
  resolvedReports: number;
}

export const getStudentDashboard = async () => {
  const { data } = await api.get<StudentDashboard>('/dashboard/student');
  return data;
};
