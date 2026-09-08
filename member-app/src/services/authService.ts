import api from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; organizationId: string | null; collegeId: string | null };
}

export const login = async (email: string, password: string) => {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
};

export interface RegisterMemberInput {
  email: string;
  password: string;
  name: string;
  joinCode?: string;
  mobile?: string;
  collegeId?: string;
  studentNumber?: string;
  department?: string;
  course?: string;
  year?: number;
}

export type RegisterStudentInput = RegisterMemberInput;

export const registerMember = async (input: RegisterMemberInput) => {
  const { data } = await api.post<LoginResponse>('/auth/register/member', {
    email: input.email,
    password: input.password,
    name: input.name,
    joinCode: input.joinCode,
    mobile: input.mobile,
  });
  return data;
};

export const registerStudent = registerMember;

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
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

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const { data } = await api.patch<{ success: boolean }>('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return data;
};
