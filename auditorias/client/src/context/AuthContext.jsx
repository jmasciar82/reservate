import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    _id: 'demo-user-id',
    name: 'Usuario Admin (Demo)',
    email: 'demo@auditorias.com',
    picture: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    role: 'Admin'
  });
  const [token, setToken] = useState('demo-token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('token', 'demo-token');
  }, []);

  const login = async () => {
    return { success: true };
  };

  const logout = () => {
    console.log("Logout llamado");
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
