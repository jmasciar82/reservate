import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuditCard from '../components/AuditCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StorageWidget from '../components/StorageWidget';
import { useToast } from '../components/Toast';
import './AuditListPage.css';

const AuditListPage = () => {
  const { success, error } = useToast();
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', pdvCode: '' });
  
  const [auditToDelete, setAuditToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [pendingOffline, setPendingOffline] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkPendingOffline();
    fetchAudits();

    const handleOnline = () => {
      handleAutoSync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
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
      const res = await syncAllPendingAudits();
      if (res.syncedCount > 0) {
        success(`✅ Se sincronizaron ${res.syncedCount} auditoría(s) guardadas sin conexión`);
        fetchAudits();
      }
      checkPendingOffline();
    } catch (e) {
      console.warn("Auto sync error:", e);
    } finally {
      setSyncing(false);
    }
  };

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.date) query.append('date', filters.date);
      if (filters.pdvCode) query.append('pdvCode', filters.pdvCode);
      
      const res = await api.get(`/api/audits?${query.toString()}`);
      setAudits(Array.isArray(res.data) ? res.data : (res.data?.audits || (Array.isArray(res) ? res : [])));
    } catch (err) {
      console.error("Error fetching audits", err);
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

  const handleDownloadConsolidatedPdf = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.open(`${apiUrl}/api/audits/report/pdf`, '_blank');
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container audit-list-container animate-fade-in">
      <div className="page-header list-page-header">
        <h1 className="page-title">Auditorías</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={handleDownloadConsolidatedPdf}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            <span>Reporte PDF General</span>
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
