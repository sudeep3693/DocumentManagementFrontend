import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClientsApi, getLoansApi, getAllDocumentWritersApi, getUserProfileApi, getPublicNoticesApi } from '../services/api';
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
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Fire all requests in parallel
        const [clientsRes, loansRes, completedRes, writersRes, profileRes, noticesRes] = await Promise.all([
          getClientsApi({ page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getLoansApi({ completed: false, page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getLoansApi({ completed: true, page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getAllDocumentWritersApi({ page: 0, size: 1 }).catch(() => ({ totalElements: 0 })),
          getUserProfileApi().catch(() => null),
          getPublicNoticesApi({ page: 0, size: 6, sort: 'id,desc' }).catch(() => ({ content: [] }))
        ]);

        setStats({
          totalClients: clientsRes.totalElements || 0,
          activeLoans: loansRes.totalElements || 0,
          completedLoans: completedRes.totalElements || 0,
          documentWriters: writersRes.totalElements || writersRes.length || 0,
        });
        setProfile(profileRes);
        setNotices(noticesRes.content || []);
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

      {/* ─── Notices Section ─── */}
      <div style={{ marginTop: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '1.25rem' }}>
          Announcements & Notices
        </h3>
        
        {loading ? (
          <p style={{ color: 'var(--gray-500)' }}>Loading notices...</p>
        ) : notices.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>No active notices right now.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {notices.map(notice => (
              <div 
                key={notice.id} 
                onClick={() => navigate(`/notices/${notice.id}`)}
                style={{
                  background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {notice.images && notice.images.length > 0 ? (
                  <div style={{ height: '160px', width: '100%', overflow: 'hidden' }}>
                    <img 
                      src={notice.images[0].imageUrl} 
                      alt="Notice Cover" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    height: '160px', width: '100%', 
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                  }}>
                    <span style={{ fontSize: '3rem', opacity: 0.9 }}>📢</span>
                  </div>
                )}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--gray-900)' }}>
                    {notice.title}
                  </h4>
                  <p style={{ 
                    margin: 0, fontSize: '0.9rem', color: 'var(--gray-600)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {notice.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
