import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getItem, setItem, deleteItem } from '../services/storage';
import { setAuthFailureHandler } from '../services/api';
import { flushSos } from '../services/pendingSos';
import { login as loginRequest, registerStudent as registerRequest, getMe, RegisterStudentInput } from '../services/authService';

interface SessionUser {
  id: string;
  email: string;
  role: string;
  collegeId: string | null;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterStudentInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.message ?? fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // When the axios layer detects a dead session (refresh failed / account
  // revoked) it calls this — drop the user so the guard below bounces to login.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    return () => setAuthFailureHandler(null);
  }, []);

  // Route guard: if the session dies while the user is deep in the app (refresh
  // failed / account revoked), bounce them to login. The forward direction
  // (login/register → app) stays with those screens' own explicit navigation.
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [user, segments, isLoading]);

  // Once signed in, deliver any emergency alerts that were queued offline.
  useEffect(() => {
    if (user) flushSos().catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    (async () => {
      const token = await getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await getMe();
        setUser({
          id: me.id,
          email: me.email,
          role: me.role,
          collegeId: me.student?.collegeId ?? me.collegeAdmin?.collegeId ?? null,
        });
      } catch {
        await deleteItem('accessToken');
        await deleteItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistSession = useCallback(async (data: { accessToken: string; refreshToken: string; user: SessionUser }) => {
    await setItem('accessToken', data.accessToken);
    await setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const data = await loginRequest(email, password);
      await persistSession(data);
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not sign in. Check your email and password.');
      setError(message);
      throw new Error(message);
    }
  }, [persistSession]);

  const register = useCallback(async (input: RegisterStudentInput) => {
    setError(null);
    try {
      const data = await registerRequest(input);
      await persistSession(data);
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not create your account.');
      setError(message);
      throw new Error(message);
    }
  }, [persistSession]);

  const logout = useCallback(async () => {
    await deleteItem('accessToken');
    await deleteItem('refreshToken');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
