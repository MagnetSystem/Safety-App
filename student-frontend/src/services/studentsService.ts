import api from './api';
import type { StudentProfile } from '../types';

export const getMyProfile = async () => {
  const { data } = await api.get<StudentProfile>('/students/me');
  return data;
};

export const updateMyProfile = async (input: Partial<StudentProfile>) => {
  const { data } = await api.patch<StudentProfile>('/students/me', input);
  return data;
};

export const exportMyData = async () => {
  const { data } = await api.get('/students/me/export');
  return data as Record<string, unknown>;
};

export const deleteMyAccount = async () => {
  const { data } = await api.delete<{ success: boolean }>('/students/me');
  return data;
};
