import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setTokens, clearTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Bootstrap: check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('dalti_access_token');
    if (token) {
      authAPI.me()
        .then(data => {
          setUser(data.user);
          setIsLoggedIn(true);
        })
        .catch(() => {
          clearTokens();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for forced logout (401 refresh failure)
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setIsLoggedIn(false);
    };
    window.addEventListener('dalti:logout', handler);
    return () => window.removeEventListener('dalti:logout', handler);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password);
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
    setIsLoggedIn(true);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await authAPI.register(formData);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    clearTokens();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
