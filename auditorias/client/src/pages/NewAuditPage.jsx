import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../components/Toast';
import ImageUploader from '../components/ImageUploader';
import './NewAuditPage.css';

const STEPS = ['Información', 'Fotos Antes', 'Fotos Después', 'Revisión'];

const NewAuditPage = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    pdvCode: '',
    observations: ''
  });
  
  const [beforeImages, setBeforeImages] = useState([]);
  const [afterImages, setAfterImages] = useState([]);

  const handleNext = () => {
    if (currentStep === 0 && !formData.pdvCode.trim()) {
      error('El código PDV es obligatorio');
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
      const code = formData.pdvCode.trim();

      // 1. Create audit record
      const auditRes = await api.post('/api/audits', {
        pdvCode: code,
        povCode: code,
        observations: formData.observations
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
        {currentStep === 0 && (
          <div className="step-content animate-slide-up">
            <div className="form-group">
              <label className="form-label">Código de Punto de Venta (PDV) *</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.pdvCode} 
                onChange={(e) => setFormData({...formData, pdvCode: e.target.value})} 
                placeholder="Ej. PDV-1323" 
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Observaciones (Opcional)</label>
              <textarea 
                className="form-textarea" 
                rows="4" 
                value={formData.observations} 
                onChange={(e) => setFormData({...formData, observations: e.target.value})} 
                placeholder="Detalles adicionales del trabajo realizado..."
              ></textarea>
            </div>
          </div>
        )}

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

        {currentStep === 3 && (
          <div className="step-content animate-slide-up">
            <h3 className="review-title">Resumen de la Auditoría</h3>
            <div className="review-section">
              <p><strong>POV:</strong> {formData.povCode}</p>
              <p><strong>Observaciones:</strong> {formData.observations || 'N/A'}</p>
            </div>
            
            <div className="review-images">
              <div className="review-image-group">
                <h4>Antes ({beforeImages.length}/2)</h4>
                <div className="review-image-grid">
                  {beforeImages.map((img, i) => (
                    <img key={i} src={img.previewUrl} alt={`Antes ${i}`} className="mini-preview" />
                  ))}
                </div>
              </div>
              <div className="review-image-group">
                <h4>Después ({afterImages.length}/3)</h4>
                <div className="review-image-grid">
                  {afterImages.map((img, i) => (
                    <img key={i} src={img.previewUrl} alt={`Después ${i}`} className="mini-preview" />
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
              Siguiente
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit} 
              disabled={submitting}
            >
              {submitting ? 'Creando...' : 'Crear Auditoría'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewAuditPage;
