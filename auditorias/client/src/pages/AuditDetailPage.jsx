import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './AuditDetailPage.css';

const AuditDetailPage = () => {
  const { id } = useParams();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState(null);
  const { success, error } = useToast();

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await api.get(`/api/audits/${id}`);
        setAudit(res.data || res);
      } catch (err) {
        error('Error al cargar la auditoría');
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [id, error]);

  const downloadPDF = async () => {
    try {
      const code = audit.pdvCode || audit.povCode || 'PDV';
      const res = await api.get(`/api/audits/${id}/pdf`);
      if (res.data && res.data.url) {
        window.open(res.data.url, '_blank');
      } else if (res.url) {
        window.open(res.url, '_blank');
      } else {
        success('Generando reporte PDF...');
      }
    } catch (err) {
      error('Error al descargar el PDF');
    }
  };

  if (loading) {
    return (
      <div className="container detail-container">
        <LoadingSkeleton type="text" />
        <LoadingSkeleton type="card" />
      </div>
    );
  }

  if (!audit) return <div className="container detail-container">Auditoría no encontrada.</div>;

  const code = audit.pdvCode || audit.povCode || 'PDV-0000';
  const beforeImages = audit.images?.beforeUrls || audit.images?.before || [];
  const afterImages = audit.images?.afterUrls || audit.images?.after || [];

  return (
    <div className="container detail-container animate-fade-in">
      <div className="detail-header card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="detail-title-group">
          <h1 className="detail-pov">{code}</h1>
          <span className="audit-id-tag">{audit.auditId}</span>
        </div>
        <div className="detail-actions">
          <button className="btn btn-primary" onClick={downloadPDF}>📄 Descargar Informe PDF</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card info-card">
          <h3>Información General</h3>
          <p><strong>ID Auditoría:</strong> {audit.auditId || audit._id}</p>
          <p><strong>Punto de Venta (PDV):</strong> {code}</p>
          <p><strong>Fecha:</strong> {new Date(audit.date || audit.createdAt).toLocaleString('es-ES')}</p>
          <p><strong>Auditor:</strong> {audit.userName || (audit.user && audit.user.name)}</p>
          <div className="obs-section" style={{ marginTop: '16px' }}>
            <strong>Observaciones:</strong>
            <p className="obs-text">{audit.observations || 'Sin observaciones'}</p>
          </div>
        </div>

        <div className="photos-container">
          <div className="card photo-card">
            <h3>Fotos Antes (2)</h3>
            {beforeImages.length > 0 ? (
              <div className="photo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                {beforeImages.map((img, i) => (
                  <img 
                    key={i} 
                    src={typeof img === 'string' ? img : img.url} 
                    alt={`Antes ${i + 1}`} 
                    className="audit-photo" 
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => setLightboxImg(typeof img === 'string' ? img : img.url)} 
                  />
                ))}
              </div>
            ) : <p className="text-muted">No hay fotos registradas</p>}
          </div>

          <div className="card photo-card mt-4" style={{ marginTop: '16px' }}>
            <h3>Fotos Después (3)</h3>
            {afterImages.length > 0 ? (
              <div className="photo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                {afterImages.map((img, i) => (
                  <img 
                    key={i} 
                    src={typeof img === 'string' ? img : img.url} 
                    alt={`Después ${i + 1}`} 
                    className="audit-photo" 
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => setLightboxImg(typeof img === 'string' ? img : img.url)} 
                  />
                ))}
              </div>
            ) : <p className="text-muted">No hay fotos registradas</p>}
          </div>
        </div>
      </div>

      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <span className="close-lightbox">✕</span>
          <img src={lightboxImg} alt="Enlarged" className="lightbox-img animate-scale-in" />
        </div>
      )}
    </div>
  );
};

export default AuditDetailPage;
