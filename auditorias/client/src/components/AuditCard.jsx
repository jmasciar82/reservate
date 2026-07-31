import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import './AuditCard.css';

const AuditCard = ({ audit }) => {
  const navigate = useNavigate();

  return (
    <div className="card audit-card animate-scale-in" onClick={() => navigate(`/auditorias/${audit.auditId || audit._id}`)}>
      <div className="audit-card-header">
        <h3 className="audit-card-title">{audit.povCode}</h3>
        <StatusBadge status={audit.status} />
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
      </div>
    </div>
  );
};

export default AuditCard;
