import api from './api';
import type { Paginated } from '../types/report';
import type { StaffMember } from '../types/organization';

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  organizationId?: string;
  collegeId?: string;
  orgRole?: 'ADMIN' | 'STAFF';
  departmentIds?: string[];
}

export const getStaff = async (params: { page?: number; pageSize?: number; organizationId?: string; collegeId?: string } = {}) => {
  const { data } = await api.get<Paginated<StaffMember>>('/staff', { params });
  return data;
};

export const createStaff = async (input: CreateStaffInput) => {
  const { data } = await api.post<StaffMember>('/staff', input);
  return data;
};

export const activateStaff = async (id: string) => {
  const { data } = await api.patch<StaffMember>(`/staff/${id}/activate`);
  return data;
};

export const deactivateStaff = async (id: string) => {
  const { data } = await api.patch<StaffMember>(`/staff/${id}/deactivate`);
  return data;
};

export const resetStaffPassword = async (id: string, newPassword: string) => {
  const { data } = await api.patch(`/staff/${id}/reset-password`, { newPassword });
  return data;
};
