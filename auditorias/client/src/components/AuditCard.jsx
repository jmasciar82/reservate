import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './AuditCard.css';

const AuditCard = ({ audit }) => {
  const navigate = useNavigate();

  const code = audit.pdvCode || audit.povCode || 'PDV-0000';

  return (
    <div className="card audit-card animate-scale-in" onClick={() => navigate(`/auditorias/${audit.auditId || audit._id}`)}>
      <div className="audit-card-header">
        <h3 className="audit-card-title">{code}</h3>
        <span className="audit-id-tag">{audit.auditId}</span>
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
