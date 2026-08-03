import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      _id: 'admin-user-id',
      name: 'Usuario Admin',
      email: 'admin@auditorias.com',
      picture: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      role: 'Admin'
    };
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || 'demo-token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [token, user]);

  const loginWithPassword = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const userData = res.data;
      setUser(userData);
      setToken(userData.token);
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      console.error("Login failed:", err);
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'Error al iniciar sesión' 
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (googleToken) => {
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
