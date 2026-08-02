import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AuditListPage from './pages/AuditListPage';
import NewAuditPage from './pages/NewAuditPage';
import AuditDetailPage from './pages/AuditDetailPage';
import UsersPage from './pages/UsersPage';

const App = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={<ProtectedRoute />}>
                <Route index element={<AuditListPage />} />
                <Route path="auditorias" element={<AuditListPage />} />
                <Route path="auditorias/nueva" element={<NewAuditPage />} />
                <Route path="auditorias/:id" element={<AuditDetailPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
