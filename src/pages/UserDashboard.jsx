import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClientsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const UserDashboard = () => {
  const { user } = useAuth();
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clients = await getClientsApi(user.id);
        setClientCount(clients.length);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-content">
      <h1>Dashboard</h1>
      <p className="page-subtitle">Welcome back, {user.name}!</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{clientCount}</h3>
            <p>Total Clients</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>{user.organization || '—'}</h3>
            <p>Organization</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3 className="capitalize">{user.status}</h3>
            <p>Account Status</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <a href="/clients" className="btn btn-primary">Manage Clients</a>
          <a href="/profile" className="btn btn-outline">View Profile</a>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
