import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuditCard from '../components/AuditCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './AuditListPage.css';

const AuditListPage = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', status: '', povCode: '' });

  useEffect(() => {
    fetchAudits();
  }, [filters]);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.date) query.append('date', filters.date);
      if (filters.status) query.append('status', filters.status);
      if (filters.povCode) query.append('povCode', filters.povCode);
      
      const res = await api.get(`/api/audits?${query.toString()}`);
      setAudits(res.data ? res.data.audits : res.audits || []);
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

      <div className="filter-bar card">
        <div className="form-group">
          <input 
            type="text" 
            name="povCode" 
            placeholder="Buscar POV..." 
            className="form-input" 
            value={filters.povCode} 
            onChange={handleFilterChange} 
          />
        </div>
        <div className="form-group">
          <input 
            type="date" 
            name="date" 
            className="form-input" 
            value={filters.date} 
            onChange={handleFilterChange} 
          />
        </div>
        <div className="form-group">
          <select 
            name="status" 
            className="form-select" 
            value={filters.status} 
            onChange={handleFilterChange}
          >
            <option value="">Todos los estados</option>
            <option value="En proceso">En proceso</option>
            <option value="Finalizada">Finalizada</option>
          </select>
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
