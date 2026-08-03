import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useToast } from './Toast';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { success, error } = useToast();

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleDownloadConsolidatedPdf = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.open(`${apiUrl}/api/audits/report/pdf`, '_blank');
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    if (logout) {
      logout();
    }
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Auditorías PDV</span>
          <span className={`network-badge ${isOnline ? 'online' : 'offline'}`}>
            <span className="network-dot"></span>
            <span>{isOnline ? 'En Línea' : 'Sin Conexión'}</span>
          </span>
        </div>
        
        {user && (
          <>
            <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
              <NavLink to="/auditorias" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} end onClick={() => setMobileMenuOpen(false)}>Auditorías</NavLink>
              <NavLink to="/auditorias/nueva" className={({isActive}) => isActive ? 'nav-link active btn-new-nav' : 'nav-link btn-new-nav'} onClick={() => setMobileMenuOpen(false)}>+ Nueva Auditoría</NavLink>
              {user && (user.role === 'Admin' || user.role === 'Supervisor') && (
                <NavLink to="/usuarios" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMobileMenuOpen(false)}>👥 Usuarios</NavLink>
              )}
              <button 
                className="nav-link btn-pdf-nav" 
                onClick={() => { setMobileMenuOpen(false); handleDownloadConsolidatedPdf(); }}
                disabled={loadingPdf}
                title="Descargar Reporte PDF General de todas las auditorías"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>Reporte PDF General</span>
              </button>

              {/* Mobile User Profile & Salir Section */}
              <div className="mobile-user-box">
                <div className="user-info">
                  <img src={user.avatar || 'https://ui-avatars.com/api/?name=' + (user.name || 'Usuario').replace(/\s*\(Demo\)/gi, '') + '&background=random'} alt="User Avatar" className="user-avatar" />
                  <div>
                    <div className="user-name">{(user.name || 'Usuario Admin').replace(/\s*\(Demo\)/gi, '')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                  </div>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={handleLogout} style={{ marginTop: '6px', width: '100%' }}>
                  🚪 Salir / Cerrar Sesión
                </button>
              </div>
            </div>

            {/* Desktop User Section */}
            <div className="navbar-user desktop-user-only">
              <div className="user-info">
                <img src={user.avatar || 'https://ui-avatars.com/api/?name=' + (user.name || 'Usuario').replace(/\s*\(Demo\)/gi, '') + '&background=random'} alt="User Avatar" className="user-avatar" />
                <span className="user-name">{(user.name || 'Usuario Admin').replace(/\s*\(Demo\)/gi, '')}</span>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={handleLogout}>Salir</button>
            </div>

            <button className="mobile-toggle" onClick={toggleMenu}>
              ☰
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
