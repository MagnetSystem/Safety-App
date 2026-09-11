import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginUser, getMe, type MeResponse } from '../services/authService';
import { clearAuth, inferRemember, readAuth, writeAuth } from '../lib/authStorage';
import { resolveOrgAppRole, type User } from '../types/user';
import { AuthContext, type AuthContextType } from './auth';

function userFromMe(me: MeResponse): User {
  const role = resolveOrgAppRole(me.role, me.orgStaff?.orgRole);
  if (!role || !me.isActive) throw new Error('This account cannot access the portal.');
  const organizationId = me.orgStaff?.organization?.id ?? null;
  const organizationName = me.orgStaff?.organization?.name ?? null;
  return { id: me.id, email: me.email, role,
    name: me.orgStaff?.name ?? (role === 'support' ? 'Support' : me.email.split('@')[0]),
    organizationId, organizationName, collegeId: organizationId, collegeName: organizationName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(!!readAuth('accessToken'));
  const [sessionError, setSessionError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);

  const logout = useCallback(() => {
    generation.current++;
    clearAuth();
    queryClient.clear();
    setUser(null);
    setLoading(false);
    setSessionError(false);
  }, [queryClient]);

  useEffect(() => {
    const expire = () => logout();
    const sync = (event: StorageEvent) => {
      if (event.key === 'accessToken' || event.key === null) {
        generation.current++;
        queryClient.clear();
        setUser(null);
        setLoading(!!readAuth('accessToken'));
        setAttempt(value => value + 1);
      }
    };
    window.addEventListener('safety:session-expired', expire);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('safety:session-expired', expire);
      window.removeEventListener('storage', sync);
    };
  }, [logout, queryClient]);

  useEffect(() => {
    if (!readAuth('accessToken')) { setLoading(false); return; }
    let cancelled = false;
    const current = generation.current;
    setLoading(true);
    setSessionError(false);
    queryClient.fetchQuery({ queryKey: ['session'], queryFn: getMe, staleTime: 0, retry: false })
      .then(me => {
        if (!cancelled && current === generation.current) setUser(userFromMe(me));
      })
      .catch(() => {
        if (!cancelled && current === generation.current) setSessionError(!!readAuth('accessToken'));
      })
      .finally(() => {
        if (!cancelled && current === generation.current) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [attempt, queryClient]);

  const applySession: AuthContextType['applySession'] = async (tokens, extras = {}, remember = inferRemember()) => {
    const current = ++generation.current;
    queryClient.clear();
    writeAuth({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }, remember);
    try {
      const next = userFromMe(await getMe());
      if (next.role === 'support' && extras.name) next.name = extras.name;
      if (current !== generation.current) throw new Error('Session changed.');
      setUser(next);
      setSessionError(false);
      setLoading(false);
    } catch (error) {
      if (current === generation.current) logout();
      throw error;
    }
  };

  const login: AuthContextType['login'] = async (email, password, remember = true) => {
    const result = await loginUser(email.trim(), password);
    await applySession(result, {}, remember);
    return resolveOrgAppRole(result.user.role);
  };

  return <AuthContext.Provider value={{
    user, role: user?.role ?? null, isAuthenticated: !!user, isLoading, sessionError,
    retrySession: () => setAttempt(value => value + 1), login, logout, applySession,
    updateLocalUser: patch => setUser(previous => previous ? { ...previous, ...patch } : null),
  }}>{children}</AuthContext.Provider>;
}
