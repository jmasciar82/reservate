import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './UsersPage.css';

const UsersPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Auditor'
  });

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data || res);
    } catch (err) {
      error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (id, newRole) => {
    setUsers(users.map(u => u._id === id ? { ...u, newRole } : u));
  };

  const handleSaveRole = async (targetUser) => {
    if (!targetUser.newRole || targetUser.newRole === targetUser.role) return;
    try {
      await api.patch(`/api/users/${targetUser._id}/role`, { role: targetUser.newRole });
      success('Rol actualizado correctamente');
      setUsers(users.map(u => u._id === targetUser._id ? { ...u, role: targetUser.newRole, newRole: undefined } : u));
    } catch (err) {
      error('Error al actualizar rol');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      error('Por favor completá todos los campos requeridos');
      return;
    }

    setCreating(true);
    try {
      const res = await api.post('/api/users', formData);
      const newUser = res.data || res;
      success(`Usuario "${newUser.name}" creado exitosamente`);
      setUsers([newUser, ...users]);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'Auditor' });
    } catch (err) {
      error(err.message || 'Error al crear el usuario');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${targetUser.name}?`)) {
      try {
        await api.delete(`/api/users/${targetUser._id}`);
        success('Usuario eliminado');
        setUsers(users.filter(u => u._id !== targetUser._id));
      } catch (err) {
        error(err.message || 'Error al eliminar usuario');
      }
    }
  };

  return (
    <div className="container users-container animate-fade-in">
      <div className="page-header list-page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Creá y administrá las cuentas de auditores y supervisores del sistema.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}>
          <span>👤+</span>
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      <div className="card users-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Listado de Usuarios</h2>
          <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>➕ Crear Usuario</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>Cargando usuarios...</div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const cleanName = (u.name || '').replace(/\s*\(Demo\)/gi, '');
                  return (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={u.picture || u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`} 
                            alt="avatar" 
                            className="table-avatar" 
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cleanName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Registrado: {new Date(u.createdAt || Date.now()).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select 
                          className="form-select role-select" 
                          value={u.newRole || u.role} 
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={u.email === 'admin@auditorias.com'}
                        >
                          <option value="Admin">Admin 🛡️</option>
                          <option value="Supervisor">Supervisor 📋</option>
                          <option value="Auditor">Auditor 🔍</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {u.newRole && u.newRole !== u.role && (
                            <button 
                              className="btn btn-sm btn-primary" 
                              onClick={() => handleSaveRole(u)}
                            >
                              Guardar Rol
                            </button>
                          )}
                          {u.email !== 'admin@auditorias.com' && (
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => handleDeleteUser(u)}
                              title="Eliminar usuario"
                              style={{ background: 'rgba(230, 57, 70, 0.15)', color: '#e63946', border: '1px solid rgba(230, 57, 70, 0.3)' }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Usuario */}
      {showModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-content card animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Crear Nuevo Usuario</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Nombre Completo *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="ej: Juan Pérez" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Email / Usuario *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="ej: juan@auditorias.com" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Contraseña *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Rol de Acceso *</label>
                <select 
                  className="form-select" 
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Auditor">Auditor (Carga auditorías y fotos)</option>
                  <option value="Supervisor">Supervisor (Revisa e imprime reportes)</option>
                  <option value="Admin">Administrador (Acceso total)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creando...' : '💾 Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
