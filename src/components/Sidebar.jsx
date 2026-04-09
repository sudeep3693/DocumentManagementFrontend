import { useState, useRef, useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COLLAPSE_DELAY_MS = 3000; // 3 seconds idle before auto-close

const Sidebar = ({ isOpen, onToggle, onMouseEnter, onMouseLeave }) => {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/admin/users', label: 'User Management', icon: '👥' },
    { to: '/admin/user-status', label: 'User Status', icon: '🔄' },
    { to: '/admin/notices', label: 'Notices', icon: '📢' },
  ];

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/clients', label: 'Clients (ग्राहक)', icon: '🏢' },
    { to: '/loans', label: 'Loans (कर्जा)', icon: '💰' },
    { to: '/taketa', label: 'Taketa (तमसुक)', icon: '📄' },
    { to: '/client-history', label: 'Client History', icon: '🗂️' },
    { to: '/loan-history', label: 'Loan History', icon: '📜' },
    { to: '/document-writers', label: 'Document Writers', icon: '✍️' },
    { to: '/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  return (
    <aside
      className={`sidebar${isOpen ? '' : ' sidebar-collapsed'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Toggle button — rides on the right edge */}
      <button
        className="sidebar-toggle-btn"
        onClick={onToggle}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        ‹
      </button>

      <div className="sidebar-header">
        <h2>📄 DocMan</h2>
        <p className="sidebar-user">{user?.name || 'User'}</p>
        <span className="sidebar-role">{role === 'admin' ? 'Admin' : 'User'}</span>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={!isOpen ? link.label : undefined}
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-link logout-btn"
          onClick={handleLogout}
          title={!isOpen ? 'Logout' : undefined}
        >
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-link-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
