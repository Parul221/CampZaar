import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cz_token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem('cz_token');
    if (!t) { setLoading(false); return; }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      localStorage.removeItem('cz_token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const { token: t, user: u } = await api.login({ email, password });
    localStorage.setItem('cz_token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const { token: t, user: u } = await api.register(data);
    localStorage.setItem('cz_token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('cz_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
