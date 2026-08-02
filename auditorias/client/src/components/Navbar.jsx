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

  const handleDownloadConsolidatedPdf = async () => {
    setLoadingPdf(true);
    success('Generando reporte PDF general...');
    try {
      const res = await api.get('/api/audits/report/pdf');
      const url = res.data?.url || res.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        error('No se pudo obtener el enlace del PDF');
      }
    } catch (err) {
      error('Error al generar el reporte PDF general');
    } finally {
      setLoadingPdf(false);
    }
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
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                📊 {loadingPdf ? 'Generando PDF...' : 'Reporte PDF General'}
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
