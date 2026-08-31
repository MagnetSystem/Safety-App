import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { loginUser, getMe } from '../services/authService';
import { toAppRole, type Role, type User } from '../types/user';

interface AuthContextType {
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Role>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadStoredUser(): User | null {
  const saved = localStorage.getItem('campus_user');
  return saved ? JSON.parse(saved) : null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const isAuthenticated = !!user && !!user.role;

  const login = async (email: string, password: string): Promise<Role> => {
    const result = await loginUser(email, password);
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);

    const appRole = toAppRole(result.user.role);

    let name = email.split('@')[0];
    let collegeName: string | null = null;
    try {
      const me = await getMe();
      if (me.collegeAdmin) {
        name = me.collegeAdmin.name;
        collegeName = me.collegeAdmin.college?.name ?? null;
      } else if (appRole === 'super_admin') {
        name = 'Platform Owner';
      }
    } catch {
      // Non-fatal — fall back to the email-derived name above.
    }

    const userData: User = {
      id: result.user.id,
      email: result.user.email,
      name,
      role: appRole,
      collegeId: result.user.collegeId,
      collegeName,
    };

    setUser(userData);
    localStorage.setItem('campus_user', JSON.stringify(userData));
    return appRole;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('campus_user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, isAuthenticated, login, logout }}>
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
