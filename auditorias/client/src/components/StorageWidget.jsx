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
  const usedMB = parseFloat(usage.usedMB || '0.0');

  // Calculate estimated photos (average ~100KB = 0.1MB per optimized photo)
  const totalCapacityMB = 25 * 1024; // 25 GB in MB
  const remainingMB = Math.max(0, totalCapacityMB - usedMB);
  const remainingPhotos = Math.floor(remainingMB / 0.1);
  const totalPhotosEst = Math.floor(totalCapacityMB / 0.1);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="photo-estimate-badge">
            📷 ~{remainingPhotos.toLocaleString('es-ES')} fotos disponibles
          </span>
          <span className="storage-percent-tag">{percent}%</span>
        </div>
      </div>

      <div className="storage-progress-bg">
        <div 
          className="storage-progress-fill" 
          style={{ width: `${Math.max(2, percent)}%`, background: barColor }}
        ></div>
      </div>

      <div className="storage-widget-footer">
        <span>Uso actual: <strong>{usedMB.toFixed(1)} MB</strong></span>
        <span>Espacio disponible: <strong>{(remainingMB / 1024).toFixed(2)} GB de 25 GB</strong></span>
      </div>
    </div>
  );
};

export default StorageWidget;
