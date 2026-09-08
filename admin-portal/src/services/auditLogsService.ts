import api from './api';
import type { Paginated } from '../types/report';

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; email: string; role: string } | null;
  college: { id: string; name: string } | null;
}

export const getAuditLogs = async (params: { page?: number; pageSize?: number; collegeId?: string } = {}) => {
  const { data } = await api.get<Paginated<AuditLogEntry>>('/audit-logs', { params });
  return data;
};
