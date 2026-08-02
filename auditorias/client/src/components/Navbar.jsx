import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
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
