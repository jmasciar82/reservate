import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import './AuditCard.css';

const AuditCard = ({ audit, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const code = audit.pdvCode || audit.povCode || 'PDV-0000';
  const canDelete = user?.role === 'Admin' || user?.role === 'Supervisor';

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(audit);
    }
  };

  return (
    <div className="card audit-card animate-scale-in" onClick={() => navigate(`/auditorias/${audit.auditId || audit._id}`)}>
      <div className="audit-card-header">
        <h3 className="audit-card-title">{code}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="audit-id-tag">{audit.auditId}</span>
          {onDelete && canDelete && (
            <button 
              className="card-delete-btn" 
              onClick={handleDelete}
              title="Eliminar auditoría"
              style={{
                background: 'rgba(230, 57, 70, 0.15)',
                border: '1px solid rgba(230, 57, 70, 0.3)',
                color: '#e63946',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s ease'
              }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="audit-card-body">
        <p className="audit-card-info">
          <span className="icon">📅</span> 
          {new Date(audit.date || audit.createdAt).toLocaleDateString('es-ES')}
        </p>
        <p className="audit-card-info">
          <span className="icon">👤</span> 
          {(audit.userName || (audit.user && audit.user.name) || 'Usuario Admin').replace(/\s*\(Demo\)/gi, '')}
        </p>
        {audit.location && audit.location.latitude && audit.location.longitude && (
          <p className="audit-card-info" style={{ marginTop: '4px' }}>
            <span className="icon">📍</span>
            <a 
              href={`https://www.google.com/maps?q=${audit.location.latitude},${audit.location.longitude}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#0066cc', textDecoration: 'underline', fontSize: '0.85rem' }}
            >
              GPS: {audit.location.latitude.toFixed(4)}, {audit.location.longitude.toFixed(4)}
            </a>
          </p>
        )}
        {audit.observations && (
          <p className="audit-card-obs" style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            💬 {audit.observations}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuditCard;
