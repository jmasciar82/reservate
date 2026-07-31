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

  const handleSaveRole = async (user) => {
    if (!user.newRole || user.newRole === user.role) return;
    try {
      await api.patch(`/api/users/${user._id}/role`, { role: user.newRole });
      success('Rol actualizado');
      setUsers(users.map(u => u._id === user._id ? { ...u, role: user.newRole, newRole: undefined } : u));
    } catch (err) {
      error('Error al actualizar rol');
    }
  };

  return (
    <div className="container users-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Gestión de Usuarios</h1>
      </div>

      <div className="card users-card">
        {loading ? (
          <div className="text-center">Cargando...</div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} alt="avatar" className="table-avatar" />
                    </td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select 
                        className="form-select role-select" 
                        value={u.newRole || u.role} 
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        disabled={u._id === user._id}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Auditor">Auditor</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary" 
                        onClick={() => handleSaveRole(u)}
                        disabled={!u.newRole || u.newRole === u.role || u._id === user._id}
                      >
                        Guardar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
