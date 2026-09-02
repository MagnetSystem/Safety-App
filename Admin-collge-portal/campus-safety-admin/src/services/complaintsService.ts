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

export const updateReportStatus = async (id: string, status: ComplaintStatus, note?: string, resolutionReport?: string) => {
  const { data } = await api.patch<Report>(`/complaints/${id}/status`, { status, note, resolutionReport });
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

export interface ComplaintMessage {
  id: string;
  body: string;
  authorRole: "STUDENT" | "COLLEGE_ADMIN" | "SUPER_ADMIN";
  authorId: string | null;
  createdAt: string;
}

export const getMessages = async (complaintId: string) => {
  const { data } = await api.get<ComplaintMessage[]>(`/complaints/${complaintId}/messages`);
  return data;
};

export const postMessage = async (complaintId: string, body: string) => {
  const { data } = await api.post<ComplaintMessage>(`/complaints/${complaintId}/messages`, { body });
  return data;
};
