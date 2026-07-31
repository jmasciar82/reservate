import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import AuditCard from '../components/AuditCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, auditsData] = await Promise.all([
          api.get('/api/audits/stats'),
          api.get('/api/audits?limit=5')
        ]);
        setStats(statsData.data || statsData); // adapt according to your backend response structure
        setRecentAudits(auditsData.data ? auditsData.data.audits : auditsData.audits || []);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container dashboard-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="grid-4">
        {loading ? (
          <>
            <LoadingSkeleton type="stat" />
            <LoadingSkeleton type="stat" />
            <LoadingSkeleton type="stat" />
            <LoadingSkeleton type="stat" />
          </>
        ) : (
          <>
            <StatCard icon="📋" label="Total Auditorías" value={stats?.total || 0} color="var(--accent-red)" />
            <StatCard icon="⏳" label="En Proceso" value={stats?.pending || 0} color="var(--accent-yellow)" />
            <StatCard icon="✅" label="Finalizadas" value={stats?.completed || 0} color="var(--accent-green)" />
            <StatCard icon="📅" label="Hoy" value={stats?.today || 0} color="var(--accent-orange)" />
          </>
        )}
      </div>

      <div className="dashboard-section">
        <h2 className="section-title">Últimas Auditorías</h2>
        <div className="grid-3">
          {loading ? (
            <>
              <LoadingSkeleton type="card" />
              <LoadingSkeleton type="card" />
              <LoadingSkeleton type="card" />
            </>
          ) : recentAudits.length > 0 ? (
            recentAudits.map(audit => <AuditCard key={audit._id || audit.auditId} audit={audit} />)
          ) : (
            <p className="empty-message">No hay auditorías recientes.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
