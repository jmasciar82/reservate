import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div className="card stat-card animate-slide-up" style={{ '--accent-color': color }}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <h3 className="stat-card-value">{value}</h3>
        <p className="stat-card-label">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
