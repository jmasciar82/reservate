import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './AuditCard.css';

const AuditCard = ({ audit, onDelete }) => {
  const navigate = useNavigate();

  const code = audit.pdvCode || audit.povCode || 'PDV-0000';

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
          {onDelete && (
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
          {audit.userName || (audit.user && audit.user.name) || 'Usuario'}
        </p>
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
