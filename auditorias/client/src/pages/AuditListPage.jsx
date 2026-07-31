import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuditCard from '../components/AuditCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './AuditListPage.css';

const AuditListPage = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', pdvCode: '' });

  useEffect(() => {
    fetchAudits();
  }, [filters]);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.date) query.append('date', filters.date);
      if (filters.pdvCode) query.append('pdvCode', filters.pdvCode);
      
      const res = await api.get(`/api/audits?${query.toString()}`);
      setAudits(Array.isArray(res.data) ? res.data : (res.data?.audits || (Array.isArray(res) ? res : [])));
    } catch (error) {
      console.error("Error fetching audits", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container audit-list-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Auditorías</h1>
        <Link to="/auditorias/nueva" className="btn btn-primary">
          <span>+</span> Nueva Auditoría
        </Link>
      </div>

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
          audits.map(audit => <AuditCard key={audit._id || audit.auditId} audit={audit} />)
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No se encontraron auditorías con esos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditListPage;
