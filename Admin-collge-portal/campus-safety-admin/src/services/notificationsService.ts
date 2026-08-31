import api from './api';
import type { Paginated } from '../types/report';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export const getNotifications = async (params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) => {
  const { data } = await api.get<Paginated<AppNotification>>('/notifications', { params });
  return data;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};
