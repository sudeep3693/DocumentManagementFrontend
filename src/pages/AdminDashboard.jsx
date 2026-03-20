import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsersApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [pending, accepted, rejected] = await Promise.all([
          getAdminUsersApi('p').catch(() => []),
          getAdminUsersApi('a').catch(() => []),
          getAdminUsersApi('r').catch(() => []),
        ]);
        const p = Array.isArray(pending) ? pending.length : 0;
        const a = Array.isArray(accepted) ? accepted.length : 0;
        const r = Array.isArray(rejected) ? rejected.length : 0;
        setCounts({ pending: p, accepted: a, rejected: r, total: p + a + r });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-content">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">System overview</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{counts.total}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{counts.pending}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{counts.accepted}</h3>
            <p>Accepted</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{counts.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>Manage Users</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
