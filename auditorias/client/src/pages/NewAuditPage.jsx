import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import ImageUploader from '../components/ImageUploader';
import './NewAuditPage.css';

const STEPS = ['Punto de Venta', 'Fotos Antes', 'Fotos Después', 'Observaciones', 'Revisión'];

const NewAuditPage = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const [pdvNumber, setPdvNumber] = useState('');
  const [observations, setObservations] = useState('');
  
  const [beforeImages, setBeforeImages] = useState([]);
  const [afterImages, setAfterImages] = useState([]);

  const getFullPdvCode = () => {
    const clean = pdvNumber.replace(/^PDV-/i, '').trim();
    return clean ? `PDV-${clean}` : '';
  };

  const handleNext = () => {
    if (currentStep === 0 && !pdvNumber.trim()) {
      error('Ingresá el número del Punto de Venta');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fullCode = getFullPdvCode();

      // 1. Create audit record
      const auditRes = await api.post('/api/audits', {
        pdvCode: fullCode,
        povCode: fullCode,
        observations: observations
      });
      
      const auditId = auditRes.data ? (auditRes.data._id || auditRes.data.auditId) : (auditRes._id || auditRes.auditId);
      
      // 2. Upload Before images
      for (let i = 0; i < beforeImages.length; i++) {
        const formDataPayload = new FormData();
        formDataPayload.append('image', beforeImages[i].file);
        formDataPayload.append('type', 'before');
        await api.upload(`/api/audits/${auditId}/images`, formDataPayload);
      }
      
      // 3. Upload After images
      for (let i = 0; i < afterImages.length; i++) {
        const formDataPayload = new FormData();
        formDataPayload.append('image', afterImages[i].file);
        formDataPayload.append('type', 'after');
        await api.upload(`/api/audits/${auditId}/images`, formDataPayload);
      }
      
      success('Auditoría guardada correctamente');
      navigate(`/auditorias/${auditId}`);
    } catch (err) {
      console.error(err);
      error(err.message || 'Error al guardar la auditoría');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container new-audit-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Nueva Auditoría</h1>
      </div>

      <div className="stepper">
        {STEPS.map((step, idx) => (
          <div key={idx} className={`step ${idx <= currentStep ? 'active' : ''}`}>
            <div className="step-circle">{idx + 1}</div>
            <div className="step-label">{step}</div>
            {idx < STEPS.length - 1 && <div className={`step-line ${idx < currentStep ? 'active' : ''}`}></div>}
          </div>
        ))}
      </div>

      <div className="card new-audit-card">
        {/* Paso 0: Punto de Venta */}
        {currentStep === 0 && (
          <div className="step-content animate-slide-up">
            <div className="form-group">
              <label className="form-label">Número del Punto de Venta (PDV) *</label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                El prefijo <strong>PDV-</strong> ya está cargado. Ingresá solo el número (ej: 1323).
              </p>
              <div className="pdv-input-container">
                <span className="pdv-prefix">PDV-</span>
                <input 
                  type="text" 
                  className="form-input pdv-input" 
                  value={pdvNumber} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/^PDV-/i, '');
                    setPdvNumber(val);
                  }} 
                  placeholder="1323" 
                  autoFocus
                />
              </div>
              {pdvNumber && (
                <div style={{ marginTop: '12px', fontSize: '0.95rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  ✓ Código completo: <span>{getFullPdvCode()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paso 1: Fotos del Antes */}
        {currentStep === 1 && (
          <div className="step-content animate-slide-up">
            <ImageUploader 
              label="Fotos del Antes"
              images={beforeImages}
              maxImages={2}
              onAdd={(img) => setBeforeImages(prev => [...prev, img])}
              onRemove={(idx) => setBeforeImages(prev => prev.filter((_, i) => i !== idx))}
            />
          </div>
        )}

        {/* Paso 2: Fotos del Después */}
        {currentStep === 2 && (
          <div className="step-content animate-slide-up">
            <ImageUploader 
              label="Fotos del Después"
              images={afterImages}
              maxImages={3}
              onAdd={(img) => setAfterImages(prev => [...prev, img])}
              onRemove={(idx) => setAfterImages(prev => prev.filter((_, i) => i !== idx))}
            />
          </div>
        )}

        {/* Paso 3: Observaciones */}
        {currentStep === 3 && (
          <div className="step-content animate-slide-up">
            <div className="form-group">
              <label className="form-label">Observaciones del Trabajo Realizado (Opcional)</label>
              <textarea 
                className="form-textarea" 
                rows="6" 
                value={observations} 
                onChange={(e) => setObservations(e.target.value)} 
                placeholder="Escribí aquí cualquier detalle u observación relevante sobre la visita al punto de venta..."
                autoFocus
              ></textarea>
            </div>
          </div>
        )}

        {/* Paso 4: Revisión Final */}
        {currentStep === 4 && (
          <div className="step-content animate-slide-up">
            <h3 className="review-title">Resumen de la Auditoría</h3>
            <div className="review-section">
              <p><strong>Punto de Venta:</strong> {getFullPdvCode()}</p>
              <p><strong>Observaciones:</strong> {observations || 'Sin observaciones registradas'}</p>
            </div>
            
            <div className="review-images">
              <div className="review-image-group">
                <h4>Fotos del Antes ({beforeImages.length}/2)</h4>
                <div className="review-image-grid">
                  {beforeImages.map((img, i) => (
                    <img key={i} src={img.previewUrl} alt={`Antes ${i + 1}`} className="mini-preview" />
                  ))}
                </div>
              </div>
              <div className="review-image-group">
                <h4>Fotos del Después ({afterImages.length}/3)</h4>
                <div className="review-image-grid">
                  {afterImages.map((img, i) => (
                    <img key={i} src={img.previewUrl} alt={`Después ${i + 1}`} className="mini-preview" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="step-actions">
          <button 
            className="btn btn-secondary" 
            onClick={handlePrev} 
            disabled={currentStep === 0 || submitting}
          >
            Anterior
          </button>
          
          {currentStep < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              Siguiente →
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Guardando...' : '💾 Guardar Auditoría'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewAuditPage;
