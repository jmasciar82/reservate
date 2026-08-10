import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuditCard from '../components/AuditCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StorageWidget from '../components/StorageWidget';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import './AuditListPage.css';

const AuditListPage = () => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', pdvCode: '' });
  
  const [auditToDelete, setAuditToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [pendingOffline, setPendingOffline] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (user?.role === 'Viewer') {
      setLoading(false);
      return;
    }
    checkPendingOffline();
    fetchAudits();

    const handleOnline = () => {
      handleAutoSync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (user?.role === 'Viewer') return;
    fetchAudits();
  }, [filters]);

  const checkPendingOffline = async () => {
    try {
      const { getPendingOfflineAudits } = await import('../utils/offlineStorage');
      const list = await getPendingOfflineAudits();
      setPendingOffline(list);
    } catch (e) {
      console.warn("Check offline error:", e);
    }
  };

  const handleAutoSync = async () => {
    try {
      const { syncAllPendingAudits } = await import('../utils/syncManager');
      setSyncing(true);
      const result = await syncAllPendingAudits();
      setSyncing(false);
      if (result.synced > 0) {
        success(`Se sincronizaron ${result.synced} auditoría(s)`);
        checkPendingOffline();
        fetchAudits();
      }
    } catch (e) {
      setSyncing(false);
      console.warn("Auto sync error:", e);
    }
  };

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.date) params.append('date', filters.date);
      if (filters.pdvCode) params.append('pdvCode', filters.pdvCode);
      const res = await api.get(`/api/audits?${params.toString()}`);
      setAudits(res.data || res || []);
    } catch (err) {
      console.error("Error fetching audits:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!auditToDelete) return;
    setDeleting(true);
    try {
      const targetId = auditToDelete.auditId || auditToDelete._id;
      await api.delete(`/api/audits/${targetId}`);
      setAudits(prev => prev.filter(a => (a._id !== auditToDelete._id && a.auditId !== auditToDelete.auditId)));
      success(`Auditoría ${auditToDelete.pdvCode || auditToDelete.povCode} eliminada`);
      setAuditToDelete(null);
    } catch (err) {
      error('Error al eliminar la auditoría');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadConsolidatedPdf = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    setGeneratingPdf(true);
    try {
      const response = await fetch(`${apiUrl}/api/audits/report/pdf`);
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Auditorias_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      error('Error al descargar el reporte PDF');
      console.error(err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // --- Viewer-only view ---
  if (user?.role === 'Viewer') {
    return (
      <div className="container animate-fade-in" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {generatingPdf && (
          <div className="pdf-loading-overlay">
            <div className="pdf-loading-card card animate-scale-in">
              <div className="pdf-spinner"></div>
              <h2 style={{ color: 'var(--text-primary)', marginTop: '20px' }}>Generando Reporte PDF</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Cargando imágenes y datos, esto puede tardar unos segundos...</p>
            </div>
          </div>
        )}
        <div className="viewer-panel card" style={{ textAlign: 'center', padding: '48px 40px', maxWidth: '480px', width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', marginBottom: '8px' }}>Reporte de Auditorías</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '0.95rem' }}>
            Descargá el reporte PDF consolidado con todas las auditorías cargadas.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={handleDownloadConsolidatedPdf}
            disabled={generatingPdf}
            style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            {generatingPdf ? 'Generando...' : 'Descargar Reporte PDF General'}
          </button>
        </div>
      </div>
    );
  }

  // --- Normal view (Admin, Supervisor, Auditor) ---
  return (
    <div className="container audit-list-container animate-fade-in">
      {generatingPdf && (
        <div className="pdf-loading-overlay">
          <div className="pdf-loading-card card animate-scale-in">
            <div className="pdf-spinner"></div>
            <h2 style={{ color: 'var(--text-primary)', marginTop: '20px' }}>Generando Reporte PDF</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Cargando imágenes y datos, esto puede tardar unos segundos...</p>
          </div>
        </div>
      )}

      <div className="page-header list-page-header">
        <h1 className="page-title">Auditorías</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleDownloadConsolidatedPdf} disabled={generatingPdf}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>{generatingPdf ? 'Generando...' : 'Reporte PDF General'}</span>
          </button>
          <Link to="/auditorias/nueva" className="btn btn-primary">
            <span>+</span> Nueva Auditoría
          </Link>
        </div>
      </div>

      {pendingOffline.length > 0 && (
        <div style={{ padding: '14px 18px', background: 'rgba(233, 196, 106, 0.12)', border: '1px solid rgba(233, 196, 106, 0.3)', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📶</span>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e9c46a' }}>
                Tenés {pendingOffline.length} auditoría(s) guardadas sin conexión
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Se subirán automáticamente al recuperar conexión a internet.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-primary" 
            onClick={handleAutoSync} 
            disabled={syncing}
            style={{ background: 'linear-gradient(135deg, #e9c46a, #f4a261)', color: '#000', border: 'none', fontWeight: 700 }}
          >
            {syncing ? '⌛ Sincronizando...' : '⚡ Sincronizar Ahora'}
          </button>
        </div>
      )}

      <StorageWidget />

      <div className="filter-bar card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input 
            type="text" 
            name="pdvCode" 
            placeholder="Buscar por Punto de Venta (ej. PDV-1323)..." 
            className="form-input" 
            value={filters.pdvCode} 
            onChange={handleFilterChange} 
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <input 
            type="date" 
            name="date" 
            className="form-input" 
            value={filters.date} 
            onChange={handleFilterChange} 
          />
        </div>
      </div>

      <div className="grid-3">
        {loading ? (
          <>
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
            <LoadingSkeleton type="card" />
          </>
        ) : audits.length > 0 ? (
          audits.map(audit => (
            <AuditCard 
              key={audit._id || audit.auditId} 
              audit={audit} 
              onDelete={item => setAuditToDelete(item)}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No se encontraron auditorías con esos filtros.</p>
          </div>
        )}
      </div>

      {auditToDelete && (
        <div className="modal-backdrop" onClick={() => setAuditToDelete(null)}>
          <div className="modal-content card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <h2 style={{ color: '#e63946' }}>⚠️ Eliminar Auditoría</h2>
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
              ¿Estás seguro de que deseas eliminar la auditoría <strong>{auditToDelete.pdvCode || auditToDelete.povCode}</strong> ({auditToDelete.auditId})?
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-outline" onClick={() => setAuditToDelete(null)} disabled={deleting}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleting} style={{ background: '#e63946', color: '#fff', border: 'none' }}>
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditListPage;
