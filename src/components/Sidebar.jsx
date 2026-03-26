import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
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
  ];

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/clients', label: 'Clients (ग्राहक)', icon: '🏢' },
    { to: '/loans', label: 'Loans (कर्जा)', icon: '💰' },
    { to: '/profile', label: 'Profile', icon: '👤' },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  return (
    <aside className="sidebar">
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
          >
            <span className="sidebar-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link logout-btn" onClick={handleLogout}>
          <span className="sidebar-icon">🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
