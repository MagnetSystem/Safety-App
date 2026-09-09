import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginUser, getMe } from '../services/authService';
import { clearAuth, inferRemember, readAuth, writeAuth, writeUser } from '../lib/authStorage';
import { resolveOrgAppRole, toAppRole, type Role, type User } from '../types/user';

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<Role>;
  logout: () => void;
  applySession: (tokens: { accessToken: string; refreshToken: string; user: { id: string; email: string; role: string; organizationId?: string | null; collegeId?: string | null } }, extras?: Partial<User>, remember?: boolean) => Promise<void>;
  updateLocalUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadStoredUser(): User | null {
  const saved = readAuth('safety_user');
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as User;
    parsed.role = toAppRole(parsed.role) ?? parsed.role;
    return parsed;
  } catch {
    return null;
  }
}

function persist(user: User | null) {
  if (user) writeUser(JSON.stringify(user));
  else clearAuth();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const isAuthenticated = !!user && !!user.role;

  const applySession: AuthContextType['applySession'] = async (tokens, extras = {}, remember = inferRemember()) => {
    writeAuth(
      { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
      remember,
    );
    queryClient.clear();
    let appRole = toAppRole(tokens.user.role);
    let name = extras.name ?? user?.name ?? tokens.user.email.split('@')[0];
    let organizationName = extras.organizationName ?? null;
    let organizationId = tokens.user.organizationId ?? tokens.user.collegeId ?? extras.organizationId ?? null;
    try {
      const me = await getMe();
      appRole = resolveOrgAppRole(me.role, me.orgStaff?.orgRole) ?? appRole;
      if (me.orgStaff) {
        name = me.orgStaff.name;
        organizationName = me.orgStaff.organization?.name ?? organizationName;
        organizationId = me.orgStaff.organization?.id ?? organizationId;
      } else if (appRole === 'support') {
        name = extras.name ?? user?.name ?? 'Support';
      }
    } catch {
      // keep derived name
    }
    const next: User = {
      id: tokens.user.id,
      email: tokens.user.email,
      name,
      role: appRole,
      organizationId,
      organizationName,
      collegeId: organizationId,
      collegeName: organizationName,
      supportSession: extras.supportSession ?? (appRole === 'support' && organizationId
        ? { organizationId, organizationName: organizationName ?? 'Organization' }
        : null),
    };
    setUser(next);
    persist(next);
  };

  const login = async (email: string, password: string, remember = true): Promise<Role> => {
    const result = await loginUser(email, password);
    await applySession(result, {}, remember);
    const saved = loadStoredUser();
    return saved?.role ?? null;
  };

  const logout = () => {
    queryClient.clear();
    setUser(null);
    persist(null);
  };

  const updateLocalUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  };

  useEffect(() => {
    if (!readAuth('accessToken')) return;
    let cancelled = false;
    getMe()
      .then((me) => {
        if (cancelled) return;
        const appRole = resolveOrgAppRole(me.role, me.orgStaff?.orgRole);
        if (!appRole) return;
        setUser((prev) => {
          if (!prev) return prev;
          const name = me.orgStaff?.name ?? prev.name;
          const organizationName = me.orgStaff?.organization?.name ?? prev.organizationName;
          const organizationId = me.orgStaff?.organization?.id ?? prev.organizationId;
          if (
            prev.role === appRole &&
            prev.name === name &&
            prev.organizationName === organizationName &&
            prev.organizationId === organizationId
          ) {
            return prev;
          }
          const next: User = {
            ...prev,
            role: appRole,
            name,
            organizationName,
            organizationId,
            collegeId: organizationId,
            collegeName: organizationName,
          };
          persist(next);
          return next;
        });
      })
      .catch(() => {
        // Keep the stored session; a 401 interceptor already sends the user to login.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, isAuthenticated, login, logout, applySession, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
