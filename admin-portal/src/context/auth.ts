import { createContext, useContext } from 'react';
import type { Role, User } from '../types/user';
import type { LoginResponse } from '../services/authService';

export interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: boolean;
  retrySession: () => void;
  login: (email: string, password: string, remember?: boolean) => Promise<Role>;
  logout: () => void;
  applySession: (tokens: LoginResponse, extras?: Partial<User>, remember?: boolean) => Promise<void>;
  updateLocalUser: (patch: Partial<User>) => void;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
