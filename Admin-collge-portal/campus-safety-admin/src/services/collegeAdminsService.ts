import api from './api';
import type { Paginated } from '../types/report';
import type { CollegeAdmin } from '../types/student';

export interface CreateCollegeAdminInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  collegeId: string;
}

export const getCollegeAdmins = async (params: { page?: number; pageSize?: number; collegeId?: string } = {}) => {
  const { data } = await api.get<Paginated<CollegeAdmin>>('/college-admins', { params });
  return data;
};

export const createCollegeAdmin = async (input: CreateCollegeAdminInput) => {
  const { data } = await api.post<CollegeAdmin>('/college-admins', input);
  return data;
};

export const activateCollegeAdmin = async (id: string) => {
  const { data } = await api.patch<CollegeAdmin>(`/college-admins/${id}/activate`);
  return data;
};

export const deactivateCollegeAdmin = async (id: string) => {
  const { data } = await api.patch<CollegeAdmin>(`/college-admins/${id}/deactivate`);
  return data;
};

export const resetCollegeAdminPassword = async (id: string, newPassword: string) => {
  const { data } = await api.patch(`/college-admins/${id}/reset-password`, { newPassword });
  return data;
};
