import React from 'react';
import { Navigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './LoginPage.css';

const LoginPage = () => {
  const { user, login } = useAuth();
  const { success, error } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSuccess = async (credentialResponse) => {
    const res = await login(credentialResponse.credential);
    if (res.success) {
      success('Sesión iniciada correctamente');
    } else {
      error('Error al iniciar sesión: ' + res.error);
    }
  };

  const handleError = () => {
    error('Error en la autenticación con Google');
  };

  return (
    <div className="login-container">
      <div className="login-card card animate-slide-up">
        <div className="login-logo">
          <div className="logo-circle">🔍</div>
        </div>
        <h1 className="login-title">Auditorías POV</h1>
        <p className="login-subtitle">Sistema de Auditoría de Puntos de Venta</p>
        
        <div className="login-action">
          <GoogleLogin 
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="signin_with"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
