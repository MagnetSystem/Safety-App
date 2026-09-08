import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { loginUser, getMe } from '../services/authService';
import { toAppRole, type Role, type User } from '../types/user';

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Role>;
  logout: () => void;
  applySession: (tokens: { accessToken: string; refreshToken: string; user: { id: string; email: string; role: string; organizationId?: string | null; collegeId?: string | null } }, extras?: Partial<User>) => Promise<void>;
  updateLocalUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadStoredUser(): User | null {
  const saved = localStorage.getItem('safety_user');
  return saved ? JSON.parse(saved) : null;
}

function persist(user: User | null) {
  if (user) localStorage.setItem('safety_user', JSON.stringify(user));
  else localStorage.removeItem('safety_user');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const isAuthenticated = !!user && !!user.role;

  const applySession: AuthContextType['applySession'] = async (tokens, extras = {}) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    queryClient.clear();
    const appRole = toAppRole(tokens.user.role);
    let name = extras.name ?? user?.name ?? tokens.user.email.split('@')[0];
    let organizationName = extras.organizationName ?? null;
    try {
      const me = await getMe();
      if (me.orgStaff) {
        name = me.orgStaff.name;
        organizationName = me.orgStaff.organization?.name ?? organizationName;
      } else if (appRole === 'support') {
        name = extras.name ?? user?.name ?? 'Support';
      }
    } catch {
      // keep derived name
    }
    const organizationId = tokens.user.organizationId ?? tokens.user.collegeId ?? extras.organizationId ?? null;
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

  const login = async (email: string, password: string): Promise<Role> => {
    const result = await loginUser(email, password);
    await applySession(result);
    const saved = loadStoredUser();
    return saved?.role ?? null;
  };

  const logout = () => {
    queryClient.clear();
    setUser(null);
    persist(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const updateLocalUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  };

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
