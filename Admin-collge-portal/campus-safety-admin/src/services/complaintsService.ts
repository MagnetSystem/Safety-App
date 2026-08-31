import api from './api';
import type { Paginated, Report, ComplaintStatus, Evidence } from '../types/report';

export interface QueryComplaintsParams {
  page?: number;
  pageSize?: number;
  status?: ComplaintStatus;
  search?: string;
}

export const getReports = async (params: QueryComplaintsParams = {}) => {
  const { data } = await api.get<Paginated<Report>>('/complaints', { params });
  return data;
};

export const getReportById = async (id: string) => {
  const { data } = await api.get<Report>(`/complaints/${id}`);
  return data;
};

export const updateReportStatus = async (id: string, status: ComplaintStatus, note?: string) => {
  const { data } = await api.patch<Report>(`/complaints/${id}/status`, { status, note });
  return data;
};

export const assignCommittee = async (id: string, userIds: string[]) => {
  const { data } = await api.patch<Report>(`/complaints/${id}/assign`, { userIds });
  return data;
};

export const getEvidence = async (complaintId: string) => {
  const { data } = await api.get<Evidence[]>(`/complaints/${complaintId}/evidence`);
  return data;
};
