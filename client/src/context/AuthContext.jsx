/**
 * Auth Context
 * Global authentication state management
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('ecoloop_token'));
  const [loading, setLoading] = useState(true);

  // Wake up the server immediately (fire-and-forget)
  useEffect(() => {
    api.get('/health', { timeout: 5000 }).catch(() => {});
  }, []);

  // Load user from token on mount
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get('/auth/me', { timeout: 10000 });
        setUser(data.user);
      } catch {
        // Token invalid, expired, or server unreachable
        localStorage.removeItem('ecoloop_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Safety fallback: if auth check hangs, stop loading after 10s
    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('Auth check timed out — showing app without auth');
        }
        return false;
      });
    }, 10000);

    fetchMe().finally(() => clearTimeout(safetyTimer));
  }, [token]);

  // Set up response interceptor to handle 401s dynamically in React state
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('ecoloop_token');
          setToken(null);
          setUser(null);
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ecoloop_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('ecoloop_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ecoloop_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

/** Hook to consume auth context */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
