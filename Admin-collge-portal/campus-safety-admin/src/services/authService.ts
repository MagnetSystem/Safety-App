import api from './api';
import type { BackendRole } from '../types/user';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: BackendRole; collegeId: string | null };
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
  student: unknown | null;
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

export interface RegisterCollegeInput {
  collegeName: string;
  collegeCode: string;
  state?: string;
  district?: string;
  principal?: string;
  phone?: string;
  collegeEmail?: string;
  address?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string;
}

export const registerCollege = async (input: RegisterCollegeInput) => {
  const { data } = await api.post<LoginResponse>('/auth/register/college', input);
  return data;
};
