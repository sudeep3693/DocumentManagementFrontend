import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminUsersApi } from '../services/api';

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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({ pending: 0, accepted: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

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

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const statCards = [
    {
      icon: '👥', label: 'Total Users', value: counts.total,
      accent: 'var(--primary-500)', bg: 'var(--primary-50)',
      onClick: () => navigate('/admin/user-status'),
    },
    {
      icon: '⏳', label: 'Pending Approval', value: counts.pending,
      accent: 'var(--warning-500)', bg: 'var(--warning-50)',
      onClick: () => navigate('/admin/users'),
    },
    {
      icon: '✅', label: 'Active / Accepted', value: counts.accepted,
      accent: 'var(--success-500)', bg: 'var(--success-50)',
      onClick: () => navigate('/admin/user-status'),
    },
    {
      icon: '❌', label: 'Rejected Users', value: counts.rejected,
      accent: 'var(--danger-500)', bg: 'var(--danger-50)',
      onClick: () => navigate('/admin/user-status'),
    },
  ];

  const quickActions = [
    { icon: '👥', label: 'Manage User Status', path: '/admin/user-status', variant: 'primary' },
    { icon: '⏳', label: 'Review Pending Users', path: '/admin/users', variant: 'outline' },
    { icon: '👤', label: 'View My Profile', path: '/profile', variant: 'outline' },
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
            {greeting}, {user?.name || 'Admin'} 👋
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '0.35rem' }}>
            Super Administrator &nbsp;·&nbsp; Here&apos;s your system overview for today
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

export default AdminDashboard;
