import axios from 'axios';
import { getItem, setItem, deleteItem } from './storage';

// Web/iOS simulator can reach the backend at localhost. Android emulator needs
// 10.0.2.2, and a physical device needs your machine's LAN IP — override via
// EXPO_PUBLIC_API_BASE_URL in a .env file for those cases.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    await setItem('accessToken', data.accessToken);
    await setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => (refreshPromise = null));
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
    }
    return Promise.reject(error);
  },
);

export default api;
