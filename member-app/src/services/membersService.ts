import api from './api';
import type { StudentProfile } from '../types';

export const getMyProfile = async () => {
  const { data } = await api.get<StudentProfile>('/members/me');
  return {
    ...data,
    studentNumber: data.memberNumber ?? data.studentNumber,
    college: data.organization ?? data.college,
  };
};

export const updateMyProfile = async (input: Partial<StudentProfile>) => {
  const { data } = await api.patch<StudentProfile>('/members/me', input);
  return data;
};

export const joinOrganization = async (joinCode: string) => {
  const { data } = await api.post<StudentProfile>('/members/me/join', { joinCode });
  return data;
};

export const exportMyData = async () => {
  const { data } = await api.get('/members/me/export');
  return data as Record<string, unknown>;
};

export const deleteMyAccount = async () => {
  const { data } = await api.delete<{ success: boolean }>('/members/me');
  return data;
};
