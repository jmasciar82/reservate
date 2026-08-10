import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import './LoginPage.css';

const LoginPage = () => {
  const { user, loginWithPassword } = useAuth();
  const { success, error } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      error('Por favor ingresá el usuario');
      return;
    }
    if (!password) {
      error('Por favor ingresá la contraseña');
      return;
    }

    setSubmitting(true);
    const res = await loginWithPassword(email, password);
    setSubmitting(false);

    if (res.success) {
      success('Sesión iniciada correctamente');
    } else {
      error(res.error || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card animate-slide-up">
        <div className="login-logo">
          <img src="/dalt_logo.png" alt="DALT Logo" className="login-logo-img" />
        </div>
        <h1 className="login-title">Auditorías PDV</h1>
        <p className="login-subtitle">Acceso al Sistema</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label className="form-label">Usuario</label>
            <input 
              type="text" 
              className="form-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Ingresá tu usuario"
              required 
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label className="form-label">Contraseña</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 600 }}
            disabled={submitting}
          >
            {submitting ? 'Verificando...' : '🔑 Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
