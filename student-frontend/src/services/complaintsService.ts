import api from './api';
import type { Report, ReportType, IncidentCategoryEnum } from '../types';

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueryReportsParams {
  page?: number;
  pageSize?: number;
}

export const getReports = async (params: QueryReportsParams = {}) => {
  const { data } = await api.get<Paginated<Report>>('/complaints', { params });
  return data;
};

export const getReportById = async (id: string) => {
  const { data } = await api.get<Report>(`/complaints/${id}`);
  return data;
};

export interface CreateComplaintInput {
  type: ReportType;
  category: IncidentCategoryEnum;
  description: string;
  location?: string;
  incidentDate?: string;
  suspectedStudents?: string;
  witnesses?: string;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  deviceInfo?: string;
}

export const createComplaint = async (input: CreateComplaintInput) => {
  const { data } = await api.post<Report>('/complaints', input);
  return data;
};

export interface ComplaintMessage {
  id: string;
  body: string;
  authorRole: 'STUDENT' | 'COLLEGE_ADMIN' | 'SUPER_ADMIN';
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
