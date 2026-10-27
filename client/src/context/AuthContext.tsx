import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'member' | 'trainer';
  trainerId?: string;
  assignedTrainerId?: string;
  createdAt?: string;
}

export interface ActiveMembership {
  _id: string;
  startDate: string;
  endDate: string;
  computedStatus: 'Active' | 'Expired' | 'Upcoming';
  plan?: {
    _id: string;
    name: string;
    price: number;
    duration: number;
    benefits: string[];
  };
}

interface AuthContextType {
  user: User | null;
  activeMembership: ActiveMembership | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isMember: boolean;
  isTrainer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('flexi_token') : null;
    if (!token) {
      setUser(null);
      setActiveMembership(null);
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data.user);
        setActiveMembership(res.data.data.activeMembership || null);
      } else {
        setUser(null);
        setActiveMembership(null);
      }
    } catch (err: any) {
      console.warn('Session verification notice:', err.response?.data?.message || err.message);
      if (err.response?.status === 401) {
        setUser(null);
        setActiveMembership(null);
        localStorage.removeItem('flexi_token');
        delete api.defaults.headers.common['Authorization'];
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { user: loggedInUser, token } = res.data.data;
        if (token) {
          localStorage.setItem('flexi_token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setUser(loggedInUser);
        setLoading(false);

        // Fetch membership and additional metadata in background
        api.get('/auth/me').then(meRes => {
          if (meRes.data?.success && meRes.data?.data) {
            setUser(meRes.data.data.user);
            setActiveMembership(meRes.data.data.activeMembership || null);
          }
        }).catch(() => {});

        return { success: true, message: res.data.message, user: loggedInUser };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (!err.response
          ? 'Cannot reach backend server. Please make sure the backend is running on port 5000 (run `npm run dev:server` or `npm run dev`).'
          : 'Invalid credentials or server error.');
      return {
        success: false,
        message,
      };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.data?.success) {
        const { user: registeredUser, token } = res.data.data;
        if (token) {
          localStorage.setItem('flexi_token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setUser(registeredUser);
        setLoading(false);
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (!err.response
          ? 'Cannot reach backend server. Please make sure the backend is running on port 5000 (run `npm run dev:server` or `npm run dev`).'
          : 'Registration failed. Please check inputs.');
      return {
        success: false,
        message,
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('flexi_token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setActiveMembership(null);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const isAdmin = user?.role === 'admin';
  const isMember = user?.role === 'member';
  const isTrainer = user?.role === 'trainer';

  return (
    <AuthContext.Provider
      value={{
        user,
        activeMembership,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isMember,
        isTrainer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
