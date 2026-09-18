import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getItem, setItem, deleteItem } from '../services/storage';
import { setAuthFailureHandler } from '../services/api';
import { flushSos } from '../services/pendingSos';
import { registerForPush, unregisterPush } from '../services/push';
import { login as loginRequest, registerStudent as registerRequest, getMe, RegisterStudentInput } from '../services/authService';
import { getMyProfile } from '../services/membersService';
import { isProfileComplete } from '../lib/profileFields';

interface SessionUser {
  id: string;
  email: string;
  role: string;
  organizationId: string | null;
  collegeId: string | null;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  profileIncomplete: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (input: RegisterStudentInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfileStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.message ?? fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // Fails safe: if the profile can't be checked (network hiccup, cold token),
  // treat it as incomplete rather than silently letting the member skip it.
  const checkProfileStatus = useCallback(async (): Promise<boolean> => {
    try {
      const profile = await getMyProfile();
      return !isProfileComplete(profile);
    } catch {
      return true;
    }
  }, []);

  const refreshProfileStatus = useCallback(async () => {
    setProfileIncomplete(await checkProfileStatus());
  }, [checkProfileStatus]);

  // When the axios layer detects a dead session (refresh failed / account
  // revoked) it calls this — drop the user so the guard below bounces to login.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    return () => setAuthFailureHandler(null);
  }, []);

  // Route guard: if the session dies while the user is deep in the app (refresh
  // failed / account revoked), bounce them to login. Also catches a member
  // landing in the app (e.g. a restored session on cold start) with required
  // profile fields still missing — the login/register screens additionally
  // navigate there directly on their own success path.
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    // The guardian accept screen has to work with no session at all (a deep link can be the
    // very first thing someone opens) and handles its own routing once it's done, so it's
    // exempt from both guards here.
    const inGuardianAccept = segments[0] === 'guardian';
    if (!user && !inAuthGroup && !inGuardianAccept) {
      router.replace('/(auth)/login');
    } else if (user && profileIncomplete && !inAuthGroup && !inGuardianAccept) {
      router.replace('/(auth)/complete-profile');
    }
  }, [user, profileIncomplete, segments, isLoading]);

  // Once signed in, flush any offline SOS alerts and register for push.
  useEffect(() => {
    if (user) {
      flushSos().catch(() => {});
      registerForPush().catch(() => {});
    }
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
        const organizationId =
          me.member?.organizationId ??
          me.student?.collegeId ??
          me.orgStaff?.organizationId ??
          me.collegeAdmin?.collegeId ??
          null;
        setUser({
          id: me.id,
          email: me.email,
          role: me.role,
          organizationId,
          collegeId: organizationId,
        });
        setProfileIncomplete(await checkProfileStatus());
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
      const incomplete = await checkProfileStatus();
      setProfileIncomplete(incomplete);
      return incomplete;
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not sign in. Check your email and password.');
      setError(message);
      throw new Error(message);
    }
  }, [persistSession, checkProfileStatus]);

  const register = useCallback(async (input: RegisterStudentInput) => {
    setError(null);
    try {
      const data = await registerRequest(input);
      await persistSession(data);
      const incomplete = await checkProfileStatus();
      setProfileIncomplete(incomplete);
      return incomplete;
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not create your account.');
      setError(message);
      throw new Error(message);
    }
  }, [persistSession, checkProfileStatus]);

  const logout = useCallback(async () => {
    await unregisterPush(); // needs the still-valid token to make the authed call
    await deleteItem('accessToken');
    await deleteItem('refreshToken');
    setUser(null);
    setProfileIncomplete(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, profileIncomplete, error, login, register, logout, refreshProfileStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
