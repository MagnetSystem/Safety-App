import axios from 'axios';
import { clearAuth, inferRemember, readAuth, writeAuth } from '../lib/authStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = readAuth('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

function requestPath(url?: string) {
  if (!url) return '';
  try {
    return url.startsWith('http') ? new URL(url).pathname : url;
  } catch {
    return url;
  }
}

function skipRefresh(url?: string) {
  const path = requestPath(url);
  return /\/auth\/(login|refresh|register|forgot-password|reset-password)/.test(path);
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = readAuth('refreshToken');
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { timeout: 15_000 },
    );
    if (readAuth('refreshToken') !== refreshToken) return null;
    if (typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string') throw new Error('Invalid refresh response');
    writeAuth(
      { accessToken: data.accessToken, refreshToken: data.refreshToken },
      inferRemember(),
    );
    return data.accessToken;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && [400, 401, 403].includes(error.response.status)) return null;
    throw error;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest && error.response?.status === 401 && !originalRequest._retry && !skipRefresh(originalRequest.url)) {
      originalRequest._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => (refreshPromise = null));
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      clearAuth();
      window.dispatchEvent(new Event('safety:session-expired'));
    }
    return Promise.reject(error);
  },
);

export default api;
