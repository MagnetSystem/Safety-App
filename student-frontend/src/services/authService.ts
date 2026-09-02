import api from './api';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; collegeId: string | null };
}

export const login = async (email: string, password: string) => {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
};

export interface RegisterStudentInput {
  email: string;
  password: string;
  name: string;
  collegeId: string;
  studentNumber?: string;
  mobile?: string;
  department?: string;
  course?: string;
  year?: number;
}

export const registerStudent = async (input: RegisterStudentInput) => {
  const { data } = await api.post<LoginResponse>('/auth/register/student', input);
  return data;
};

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
