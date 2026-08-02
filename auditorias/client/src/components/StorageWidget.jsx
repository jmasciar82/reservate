import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './StorageWidget.css';

const StorageWidget = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await api.get('/api/audits/storage/usage');
      setUsage(res.data || res);
    } catch (err) {
      console.warn("Storage widget fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!usage) return null;

  const percent = usage.percent || 0.1;
  const usedMB = usage.usedMB || '0.0';

  // Dynamic progress bar color
  let barColor = 'linear-gradient(90deg, #2a9d8f, #2ec4b6)';
  if (percent > 70 && percent <= 90) {
    barColor = 'linear-gradient(90deg, #e9c46a, #f4a261)';
  } else if (percent > 90) {
    barColor = 'linear-gradient(90deg, #e63946, #d62828)';
  }

  return (
    <div className="storage-widget-card card animate-fade-in">
      <div className="storage-widget-header">
        <div className="storage-title-group">
          <span className="cloud-icon">☁️</span>
          <div>
            <h4 className="storage-title">Almacenamiento Cloudinary</h4>
            <span className="storage-subtitle">Plan Gratuito 25 GB (25 Créditos)</span>
          </div>
        </div>
        <span className="storage-percent-tag">{percent}%</span>
      </div>

      <div className="storage-progress-bg">
        <div 
          className="storage-progress-fill" 
          style={{ width: `${Math.max(2, percent)}%`, background: barColor }}
        ></div>
      </div>

      <div className="storage-widget-footer">
        <span>Uso actual: <strong>{usedMB} MB</strong></span>
        <span>Límite: <strong>25 GB</strong></span>
      </div>
    </div>
  );
};

export default StorageWidget;
