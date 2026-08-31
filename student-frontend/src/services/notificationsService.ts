import api from './api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const getNotifications = async (params: { unreadOnly?: boolean; page?: number; pageSize?: number } = {}) => {
  const { data } = await api.get<Paginated<AppNotification>>('/notifications', { params });
  return data;
};

export const markNotificationRead = async (id: string) => {
  const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch<{ success: boolean }>('/notifications/read-all');
  return data;
};
