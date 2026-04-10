import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Simple deterministic colour from a string
const avatarColour = (name = '') => {
  const colours = [
    ['#6366f1', '#4f46e5'],
    ['#0ea5e9', '#0284c7'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
    ['#ef4444', '#dc2626'],
    ['#8b5cf6', '#7c3aed'],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colours[Math.abs(hash) % colours.length];
};

const UserMenu = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.name || user?.username || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const [bg, bg2] = avatarColour(displayName);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setOpen(false);
    navigate('/profile');
  };

  const handleContact = () => {
    // Demo — nothing happens
    setOpen(false);
  };

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      {/* Trigger button */}
      <button
        id="user-menu-trigger"
        className="user-menu-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="true"
        aria-expanded={open}
        title="Account menu"
      >
        {/* Avatar */}
        <span
          className="user-menu-avatar"
          style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg2} 100%)` }}
          aria-hidden="true"
        >
          {initials}
        </span>

        {/* Name + role — hidden on small screens via CSS */}
        <span className="user-menu-info">
          <span className="user-menu-name">{displayName}</span>
          <span className="user-menu-role">{role === 'admin' ? 'Admin' : 'User'}</span>
        </span>

        {/* Chevron */}
        <span className={`user-menu-chevron${open ? ' open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="user-menu-dropdown" role="menu">
          {/* Header card */}
          <div className="user-menu-header">
            <span
              className="user-menu-avatar user-menu-avatar--lg"
              style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg2} 100%)` }}
            >
              {initials}
            </span>
            <div className="user-menu-header-info">
              <p className="user-menu-header-name">{displayName}</p>
              <p className="user-menu-header-email">{user?.email || 'No email'}</p>
            </div>
          </div>

          <div className="user-menu-divider" />

          {/* Items */}
          <button
            id="user-menu-profile"
            className="user-menu-item"
            onClick={handleProfile}
            role="menuitem"
          >
            <span className="user-menu-item-icon">👤</span>
            <span className="user-menu-item-label">Profile</span>
          </button>

          <button
            id="user-menu-contact"
            className="user-menu-item"
            onClick={handleContact}
            role="menuitem"
            title="Demo — coming soon"
          >
            <span className="user-menu-item-icon">📞</span>
            <span className="user-menu-item-label">Contact Service Provider</span>
            <span className="user-menu-item-badge">Soon</span>
          </button>

          <div className="user-menu-divider" />

          <button
            id="user-menu-logout"
            className="user-menu-item user-menu-item--danger"
            onClick={handleLogout}
            role="menuitem"
          >
            <span className="user-menu-item-icon">🚪</span>
            <span className="user-menu-item-label">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
