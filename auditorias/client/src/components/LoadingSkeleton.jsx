import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ type = 'card' }) => {
  if (type === 'stat') {
    return (
      <div className="skeleton-card skeleton">
        <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)' }} className="skeleton-pulse"></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
          <div style={{ height: '24px', width: '60%', borderRadius: '4px' }} className="skeleton-pulse"></div>
          <div style={{ height: '14px', width: '40%', borderRadius: '4px' }} className="skeleton-pulse"></div>
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div style={{ height: '20px', width: '100%', borderRadius: '4px', marginBottom: '8px' }} className="skeleton skeleton-pulse"></div>
    );
  }

  return (
    <div className="skeleton-card skeleton">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ height: '24px', width: '40%', borderRadius: '4px' }} className="skeleton-pulse"></div>
        <div style={{ height: '20px', width: '30%', borderRadius: '12px' }} className="skeleton-pulse"></div>
      </div>
      <div style={{ height: '1px', width: '100%', background: 'var(--border)', marginBottom: '16px' }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '16px', width: '70%', borderRadius: '4px' }} className="skeleton-pulse"></div>
        <div style={{ height: '16px', width: '50%', borderRadius: '4px' }} className="skeleton-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
