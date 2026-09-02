import api from './api';
import type { Paginated } from '../types/report';
import type { Student } from '../types/student';

export interface QueryStudentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  collegeId?: string;
}

export const getStudents = async (params: QueryStudentsParams = {}) => {
  const { data } = await api.get<Paginated<Student>>('/students', { params });
  return data;
};

export const getStudentById = async (id: string) => {
  const { data } = await api.get<Student>(`/students/${id}`);
  return data;
};

export const resetStudentPassword = async (id: string, newPassword: string) => {
  const { data } = await api.patch(`/students/${id}/reset-password`, { newPassword });
  return data;
};
