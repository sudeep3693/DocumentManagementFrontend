import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClientsApi, getLoansApi, getAllDocumentWritersApi, getUserProfileApi } from '../services/api';
import cache from '../utils/cache';

/* ─── Skeleton card ─── */
const StatSkeleton = () => (
  <div className="stat-card" style={{ opacity: 0.6 }}>
    <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: 'var(--gray-100)' }} />
    <div className="stat-info">
      <div style={{ width: 48, height: 24, borderRadius: 4, background: 'var(--gray-200)', marginBottom: 6 }} />
      <div style={{ width: 80, height: 14, borderRadius: 4, background: 'var(--gray-100)' }} />
    </div>
  </div>
);

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fire all requests in parallel
        const [clientsRes, loansRes, completedRes, writersRes, profileRes] = await Promise.all([
          getClientsApi({ page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getLoansApi({ completed: false, page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getLoansApi({ completed: true, page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getAllDocumentWritersApi({ page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getUserProfileApi().catch(() => null),
        ]);

        setStats({
          totalClients: clientsRes.totalElements || 0,
          activeLoans: loansRes.totalElements || 0,
          completedLoans: completedRes.totalElements || 0,
          documentWriters: writersRes.totalElements || writersRes.length || 0,
        });
        setProfile(profileRes);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const statCards = [
    {
      icon: '👥', label: 'Total Clients', value: stats?.totalClients ?? 0,
      accent: 'var(--primary-500)', bg: 'var(--primary-50)',
      onClick: () => navigate('/clients'),
    },
    {
      icon: '💰', label: 'Active Loans', value: stats?.activeLoans ?? 0,
      accent: 'var(--warning-500)', bg: 'var(--warning-50)',
      onClick: () => navigate('/loans'),
    },
    {
      icon: '✅', label: 'Completed Loans', value: stats?.completedLoans ?? 0,
      accent: 'var(--success-500)', bg: 'var(--success-50)',
      onClick: () => navigate('/loans'),
    },
    {
      icon: '✍️', label: 'Document Writers', value: stats?.documentWriters ?? 0,
      accent: 'var(--info-500)', bg: 'var(--info-50)',
      onClick: () => navigate('/document-writers'),
    },
  ];

  const quickActions = [
    { icon: '➕', label: 'Add Client', path: '/clients/new', variant: 'primary' },
    { icon: '💳', label: 'New Loan', path: '/loans/new', variant: 'primary' },
    { icon: '👥', label: 'Clients', path: '/clients', variant: 'outline' },
    { icon: '💰', label: 'Loans', path: '/loans', variant: 'outline' },
    { icon: '👤', label: 'Profile', path: '/profile', variant: 'outline' },
  ];

  return (
    <div className="page-content">
      {/* ─── Welcome banner ─── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            {greeting}, {user?.name || 'User'} 👋
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '0.35rem' }}>
            {user?.tenantName || 'Your Organization'} &nbsp;·&nbsp; Here&apos;s your overview for today
          </p>
        </div>
        <div style={{
          padding: '0.35rem 0.85rem',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          fontWeight: 600,
          backdropFilter: 'blur(4px)',
          letterSpacing: '0.02em',
        }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        {loading ? (
          <>
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </>
        ) : (
          statCards.map((s, i) => (
            <div
              key={i}
              className="stat-card"
              onClick={s.onClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon" style={{ background: s.bg, fontSize: '1.6rem' }}>
                {s.icon}
              </div>
              <div className="stat-info">
                <h3 style={{ color: s.accent }}>{s.value}</h3>
                <p>{s.label}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Quick Actions ─── */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1.25rem 1.5rem',
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '1rem' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {quickActions.map((a, i) => (
            <button
              key={i}
              className={`btn btn-${a.variant}`}
              onClick={() => navigate(a.path)}
              style={{ gap: '0.35rem' }}
            >
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
