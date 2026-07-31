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

  const handleFinish = async () => {
    try {
      await api.patch(`/api/audits/${id}/status`, { status: 'Finalizada' });
      setAudit({ ...audit, status: 'Finalizada' });
      success('Auditoría finalizada');
    } catch (err) {
      error('Error al actualizar estado');
    }
  };

  const downloadPDF = async () => {
    try {
      // Assuming GET /api/audits/:id/pdf returns a blob or triggers download.
      // Fetch does not automatically download files. Using window.open or handling blob.
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/audits/${id}/pdf`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Error al generar PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Auditoria_${audit.povCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
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

  const beforeImages = audit.images?.filter(img => img.type === 'before') || [];
  const afterImages = audit.images?.filter(img => img.type === 'after') || [];

  return (
    <div className="container detail-container animate-fade-in">
      <div className="detail-header card">
        <div className="detail-title-group">
          <h1 className="detail-pov">{audit.povCode}</h1>
          <StatusBadge status={audit.status} />
        </div>
        <div className="detail-actions">
          {audit.status === 'En proceso' && (
            <button className="btn btn-primary" onClick={handleFinish}>Finalizar Auditoría</button>
          )}
          <button className="btn btn-secondary" onClick={downloadPDF}>Descargar PDF</button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card info-card">
          <h3>Información General</h3>
          <p><strong>ID:</strong> {audit._id || audit.auditId}</p>
          <p><strong>Fecha:</strong> {new Date(audit.date || audit.createdAt).toLocaleDateString('es-ES')}</p>
          <p><strong>Usuario:</strong> {audit.userName || (audit.user && audit.user.name)}</p>
          <div className="obs-section">
            <strong>Observaciones:</strong>
            <p className="obs-text">{audit.observations || 'Sin observaciones'}</p>
          </div>
        </div>

        <div className="photos-container">
          <div className="card photo-card">
            <h3>Fotos Antes</h3>
            {beforeImages.length > 0 ? (
              <div className="photo-grid">
                {beforeImages.map((img, i) => (
                  <img 
                    key={i} 
                    src={img.url} 
                    alt={`Antes ${i}`} 
                    className="audit-photo" 
                    onClick={() => setLightboxImg(img.url)} 
                  />
                ))}
              </div>
            ) : <p className="text-muted">No hay fotos</p>}
          </div>

          <div className="card photo-card mt-4">
            <h3>Fotos Después</h3>
            {afterImages.length > 0 ? (
              <div className="photo-grid">
                {afterImages.map((img, i) => (
                  <img 
                    key={i} 
                    src={img.url} 
                    alt={`Después ${i}`} 
                    className="audit-photo" 
                    onClick={() => setLightboxImg(img.url)} 
                  />
                ))}
              </div>
            ) : <p className="text-muted">No hay fotos</p>}
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
