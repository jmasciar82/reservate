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
              <NavLink 
                to="/auditorias" 
                className={({isActive}) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'} 
                end 
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">📊</span>
                <span className="nav-text">Auditorías</span>
              </NavLink>

              <NavLink 
                to="/auditorias/nueva" 
                className={({isActive}) => isActive ? 'mobile-nav-item btn-new-mobile active' : 'mobile-nav-item btn-new-mobile'} 
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">➕</span>
                <span className="nav-text">+ Nueva Auditoría</span>
              </NavLink>

              {user && (user.role === 'Admin' || user.role === 'Supervisor') && (
                <NavLink 
                  to="/usuarios" 
                  className={({isActive}) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'} 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">Gestión de Usuarios</span>
                </NavLink>
              )}

              <button 
                className="mobile-nav-item btn-pdf-mobile" 
                onClick={() => { setMobileMenuOpen(false); handleDownloadConsolidatedPdf(); }}
                disabled={loadingPdf}
                title="Descargar Reporte PDF General de todas las auditorías"
              >
                <span className="nav-icon">📄</span>
                <span className="nav-text">Reporte PDF General</span>
              </button>

              {/* Mobile User Profile & Salir Section */}
              <div className="mobile-user-box">
                <div className="user-profile-header">
                  <img src={user.avatar || 'https://ui-avatars.com/api/?name=' + (user.name || 'Usuario').replace(/\s*\(Demo\)/gi, '') + '&background=random'} alt="User Avatar" className="user-avatar-lg" />
                  <div>
                    <div className="user-name-lg">{(user.name || 'Usuario Admin').replace(/\s*\(Demo\)/gi, '')}</div>
                    <div className="user-email-sub">{user.email}</div>
                  </div>
                </div>
                <button className="mobile-logout-btn" onClick={handleLogout}>
                  <span>🚪</span>
                  <span>Cerrar Sesión</span>
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
