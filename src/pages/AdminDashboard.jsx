import { useState, useEffect } from 'react';
import { getUsersApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUsersApi();
        setUsers(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const pending = users.filter((u) => u.status === 'pending').length;
  const approved = users.filter((u) => u.status === 'approved').length;
  const rejected = users.filter((u) => u.status === 'rejected').length;

  return (
    <div className="page-content">
      <h1>Admin Dashboard</h1>
      <p className="page-subtitle">System overview</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{pending}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{approved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <a href="/admin/users" className="btn btn-primary">Manage Users</a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
