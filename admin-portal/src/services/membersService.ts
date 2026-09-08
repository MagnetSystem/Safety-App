import api from './api';
import type { Paginated } from '../types/report';
import type { Member } from '../types/organization';

export interface QueryMembersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  organizationId?: string;
  collegeId?: string;
}

export const getMembers = async (params: QueryMembersParams = {}) => {
  const { data } = await api.get<Paginated<Member>>('/members', { params });
  return data;
};

export const getMemberById = async (id: string) => {
  const { data } = await api.get<Member>(`/members/${id}`);
  return data;
};

export const resetMemberPassword = async (id: string, newPassword: string) => {
  const { data } = await api.patch(`/members/${id}/reset-password`, { newPassword });
  return data;
};
