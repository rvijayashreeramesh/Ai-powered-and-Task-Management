'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth, getApiUrl } from '@/services/api';
import { User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const response = await fetchWithAuth('/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    let response: Response;
    try {
      response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
    } catch (netErr: any) {
      throw new Error(`Unable to connect to backend server (${getApiUrl('/auth/login')}). Please check your connection or ensure backend is active.`);
    }

    if (!response.ok) {
      let detail = 'Login failed';
      try {
        const error = await response.json();
        detail = error.detail || detail;
      } catch (_) {}
      throw new Error(detail);
    }

    const data = await response.json();
    localStorage.setItem('token', data.access_token);
    sessionStorage.setItem('token', data.access_token);
    await fetchUser();
    router.push('/dashboard');
  };

  const register = async (credentials: RegisterCredentials) => {
    let response: Response;
    try {
      response = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
    } catch (netErr: any) {
      throw new Error(`Unable to connect to backend server (${getApiUrl('/auth/register')}). Please check your connection or ensure backend is active.`);
    }

    if (!response.ok) {
      let detail = 'Registration failed';
      try {
        const error = await response.json();
        detail = error.detail || detail;
      } catch (_) {}
      throw new Error(detail);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
