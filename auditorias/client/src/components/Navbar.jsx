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
  const { success, error } = useToast();

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleDownloadConsolidatedPdf = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.open(`${apiUrl}/api/audits/report/pdf`, '_blank');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-logo">
          Auditorías PDV
        </div>
        
        {user && (
          <>
            <div className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
              <NavLink to="/auditorias" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} end onClick={() => setMobileMenuOpen(false)}>Auditorías</NavLink>
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
              <NavLink to="/auditorias/nueva" className={({isActive}) => isActive ? 'nav-link active btn-new-nav' : 'nav-link btn-new-nav'} onClick={() => setMobileMenuOpen(false)}>+ Nueva Auditoría</NavLink>
            </div>

            <div className="navbar-user">
              <div className="user-info">
                <img src={user.avatar || 'https://ui-avatars.com/api/?name=' + user.name + '&background=random'} alt="User Avatar" className="user-avatar" />
                <span className="user-name">{user.name}</span>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={logout}>Salir</button>
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
