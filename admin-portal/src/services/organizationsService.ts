import api from './api';
import type { Paginated } from '../types/report';
import type { Organization } from '../types/organization';

export interface CreateOrganizationInput {
  name: string;
  code: string;
  address?: string;
  state?: string;
  district?: string;
  principal?: string;
  phone?: string;
  email?: string;
  industry?: string;
}

export const getOrganizations = async (params: { page?: number; pageSize?: number; search?: string } = {}) => {
  const { data } = await api.get<Paginated<Organization>>('/organizations', { params });
  return data;
};

export const getMyOrganization = async () => {
  const { data } = await api.get<Organization>('/organizations/me');
  return data;
};

export const createOrganization = async (input: CreateOrganizationInput) => {
  const { data } = await api.post<Organization>('/organizations', input);
  return data;
};

export const updateOrganizationStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED') => {
  const { data } = await api.patch<Organization>(`/organizations/${id}/status`, { status });
  return data;
};

export const updateMyOrganization = async (input: Partial<CreateOrganizationInput>) => {
  const { data } = await api.patch('/organizations/me', input);
  return data;
};

export const updateMyOrgSettings = async (settings: unknown) => {
  const { data } = await api.patch('/organizations/me/settings', settings);
  return data;
};

export const rotateJoinCode = async () => {
  const { data } = await api.post<{ id: string; joinCode: string }>('/organizations/me/join-code');
  return data;
};

export const getOrganization = async (id: string) => {
  const { data } = await api.get(`/organizations/${id}`);
  return data;
};

export const resetOwnerPassword = async (organizationId: string, newPassword: string) => {
  const { data } = await api.patch(`/organizations/${organizationId}/reset-owner-password`, { newPassword });
  return data as { success: boolean; ownerEmail?: string };
};
