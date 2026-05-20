import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'cz_token';
const USER_KEY = 'cz_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    setToken(t);
    if (!t) {
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const me = await api.me();
      localStorage.setItem(USER_KEY, JSON.stringify(me));
      setUser(me);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onTokenChange = () => {
      setLoading(true);
      loadUser();
    };

    const onStorage = (event) => {
      if (event.key === TOKEN_KEY) {
        setLoading(true);
        loadUser();
      }
    };

    const onUserLoaded = (e) => {
      try {
        const u = e?.detail?.user;
        const t = e?.detail?.token || localStorage.getItem(TOKEN_KEY);
        if (u && t) {
          setToken(t);
          setUser(u);
          setLoading(false);
        }
      } catch (err) {}
    };

    window.addEventListener('cz_token_changed', onTokenChange);
    window.addEventListener('storage', onStorage);
    window.addEventListener('cz_user_loaded', onUserLoaded);
    return () => {
      window.removeEventListener('cz_token_changed', onTokenChange);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cz_user_loaded', onUserLoaded);
    };
  }, [loadUser]);

  useEffect(() => { loadUser(); }, [loadUser]);

  // If user was preloaded into localStorage by the login callback, use it
  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const s = localStorage.getItem(USER_KEY);
      if (t && s) {
        setToken(t);
        setUser(JSON.parse(s));
        setLoading(false);
      } else if (!t) {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {}
  }, []);

  const login = async (email, password) => {
    const { token: t, user: u } = await api.login({ email, password });
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const { token: t, user: u } = await api.register(data);
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await api.me();
      localStorage.setItem(USER_KEY, JSON.stringify(me));
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
