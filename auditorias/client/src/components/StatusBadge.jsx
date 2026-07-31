import React from 'react';

const StatusBadge = ({ status }) => {
  const badgeClass = status === 'En proceso' ? 'badge-pending' : 'badge-completed';
  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
