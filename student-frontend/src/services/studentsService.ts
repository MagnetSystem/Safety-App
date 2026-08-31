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
