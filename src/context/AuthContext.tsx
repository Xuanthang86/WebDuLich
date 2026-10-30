import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getCurrentUser, login as apiLogin, logout as apiLogout, getAuthToken, clearAuthToken } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInContext: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(res => {
        setUser(res.user);
      })
      .catch(() => {
        clearAuthToken();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiLogin(email, pass);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn('Logout notification error ignored:', err);
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  const updateUserInContext = (updated: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
