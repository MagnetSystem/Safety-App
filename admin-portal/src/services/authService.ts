import api from './api';
import type { BackendRole } from '../types/user';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: BackendRole;
    organizationId: string | null;
    collegeId: string | null;
  };
}

export const loginUser = async (email: string, password: string) => {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
};

export interface MeResponse {
  id: string;
  email: string;
  role: BackendRole;
  isActive: boolean;
  createdAt: string;
  member: unknown | null;
  orgStaff: {
    id: string;
    name: string;
    phone: string | null;
    orgRole: string;
    organization: { id: string; name: string; joinCode?: string; industry?: string };
  } | null;
  collegeAdmin: { id: string; name: string; phone: string | null; college: { id: string; name: string } } | null;
}

export const getMe = async () => {
  const { data } = await api.get<MeResponse>('/auth/me');
  return data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const { data } = await api.patch('/auth/change-password', { currentPassword, newPassword });
  return data;
};

export const updateMyProfile = async (input: { name?: string; phone?: string }) => {
  const { data } = await api.patch('/auth/me', input);
  return data;
};

export const enterOrganization = async (organizationId: string) => {
  const { data } = await api.post<LoginResponse>(`/auth/support/organizations/${organizationId}/enter`);
  return data;
};

export const leaveOrganization = async () => {
  const { data } = await api.post<LoginResponse>('/auth/support/leave-organization');
  return data;
};

export const forgotPassword = async (email: string) => {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, newPassword });
  return data;
};

export interface RegisterOrganizationInput {
  organizationName: string;
  organizationCode?: string;
  industry?: string;
  state?: string;
  district?: string;
  contactName?: string;
  phone?: string;
  organizationEmail?: string;
  address?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone?: string;
  setup?: Record<string, string | number | boolean>;
}

export const registerOrganization = async (input: RegisterOrganizationInput) => {
  const { data } = await api.post<LoginResponse>('/auth/register/organization', input);
  return data;
};
