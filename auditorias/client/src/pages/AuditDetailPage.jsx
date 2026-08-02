import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './AuditDetailPage.css';

const AuditDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editPdvNum, setEditPdvNum] = useState('');
  const [editObs, setEditObs] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    fetchAudit();
  }, [id]);

  const fetchAudit = async () => {
    try {
      const res = await api.get(`/api/audits/${id}`);
      const data = res.data || res;
      setAudit(data);
      const rawCode = data.pdvCode || data.povCode || '';
      setEditPdvNum(rawCode.replace(/^PDV-/i, ''));
      setEditObs(data.observations || '');
    } catch (err) {
      error('Error al cargar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
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

  const handleSaveEdit = async () => {
    if (!editPdvNum.trim()) {
      error('Por favor ingresa un número de PDV válido');
      return;
    }
    setSavingEdit(true);
    try {
      const formattedCode = `PDV-${editPdvNum.trim()}`;
      const res = await api.patch(`/api/audits/${id}`, {
        pdvCode: formattedCode,
        observations: editObs
      });
      const updated = res.data || res;
      setAudit(prev => ({ ...prev, ...updated, pdvCode: formattedCode, observations: editObs }));
      success('Auditoría actualizada correctamente');
      setIsEditing(false);
    } catch (err) {
      error('Error al guardar los cambios');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteAudit = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/audits/${id}`);
      success('Auditoría eliminada con éxito');
      navigate('/auditorias');
    } catch (err) {
      error('Error al eliminar la auditoría');
      setDeleting(false);
      setShowDeleteModal(false);
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
      <div className="detail-header card">
        <div className="detail-title-group">
          <h1 className="detail-pov">{code}</h1>
          <span className="audit-id-tag">{audit.auditId}</span>
        </div>
        <div className="detail-actions">
          <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
            ✏️ Editar
          </button>
          <button className="btn btn-primary" onClick={downloadPDF}>
            📄 Descargar PDF
          </button>
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} style={{ background: '#e63946', color: '#fff', border: 'none' }}>
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <div className="grid-2">
        <div className="card info-card">
          <h3>Información General</h3>
          <p><strong>ID Auditoría:</strong> {audit.auditId || audit._id}</p>
          <p><strong>Punto de Venta (PDV):</strong> {code}</p>
          <p><strong>Fecha:</strong> {new Date(audit.date || audit.createdAt).toLocaleString('es-ES')}</p>
          <p><strong>Auditor:</strong> {audit.userName || (audit.user && audit.user.name)}</p>
          <div className="obs-section">
            <strong>Observaciones:</strong>
            <p className="obs-text">{audit.observations || 'Sin observaciones'}</p>
          </div>
        </div>

        <div className="photos-container">
          <div className="card photo-card">
            <h3>Fotos Antes ({beforeImages.length})</h3>
            {beforeImages.length > 0 ? (
              <div className="thumbnail-grid">
                {beforeImages.map((img, i) => {
                  const url = typeof img === 'string' ? img : img.url;
                  return (
                    <div key={i} className="thumbnail-wrapper" onClick={() => setLightboxImg(url)}>
                      <img src={url} alt={`Antes ${i + 1}`} className="thumbnail-img" />
                      <span className="thumbnail-label">Antes #{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-muted">No hay fotos registradas</p>}
          </div>

          <div className="card photo-card mt-4">
            <h3>Fotos Después ({afterImages.length})</h3>
            {afterImages.length > 0 ? (
              <div className="thumbnail-grid">
                {afterImages.map((img, i) => {
                  const url = typeof img === 'string' ? img : img.url;
                  return (
                    <div key={i} className="thumbnail-wrapper" onClick={() => setLightboxImg(url)}>
                      <img src={url} alt={`Después ${i + 1}`} className="thumbnail-img" />
                      <span className="thumbnail-label">Después #{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-muted">No hay fotos registradas</p>}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <span className="close-lightbox">✕</span>
          <img src={lightboxImg} alt="Enlarged" className="lightbox-img animate-scale-in" />
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-backdrop" onClick={() => setIsEditing(false)}>
          <div className="modal-content card animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2>✏️ Editar Auditoría</h2>
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Punto de Venta (PDV)</label>
              <div className="pdv-input-container">
                <span className="pdv-prefix">PDV-</span>
                <input 
                  type="number"
                  className="form-input pdv-input"
                  value={editPdvNum}
                  onChange={e => setEditPdvNum(e.target.value)}
                  placeholder="xxxx"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Observaciones</label>
              <textarea 
                className="form-input" 
                rows="4" 
                value={editObs}
                onChange={e => setEditObs(e.target.value)}
                placeholder="Observaciones generales..."
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setIsEditing(false)} disabled={savingEdit}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 style={{ color: '#e63946' }}>⚠️ Eliminar Auditoría</h2>
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
              ¿Estás seguro de que deseas eliminar la auditoría <strong>{code}</strong> ({audit.auditId})? Se borrarán también las fotos y el archivo PDF.
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAudit} disabled={deleting} style={{ background: '#e63946', color: '#fff', border: 'none' }}>
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditDetailPage;
