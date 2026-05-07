import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getNotificationUserApi,
  getNotificationAdminApi,
  markNotificationReadApi,
} from '../services/api';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'LOAN': return '💰';
    case 'CLIENT': return '👤';
    case 'DOCUMENT': return '📄';
    case 'SYSTEM': return '📢';
    default: return '🔔';
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { role, isAuthenticated } = useAuth();
  
  const recipientType = role === 'admin' ? 'ADMIN' : 'USER';

  const fetchRealNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const data = role === 'admin' 
        ? await getNotificationAdminApi() 
        : await getNotificationUserApi();
      setNotifications(data.content || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchRealNotifications();
    // Optional: could set up an interval here for polling
  }, [role, isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleNotificationClick = async (n) => {
    if (n.isRead) return;
    try {
      await markNotificationReadApi(n.id, recipientType);
      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  return (
    <div className="notif-bell-wrapper" ref={ref}>
      <button
        className="notif-bell-btn"
        onClick={handleOpen}
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <span className="notif-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notif-bell-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications panel">
          <div className="notif-dropdown-header">
            <span>🔔 Notifications</span>
            <span className="notif-dropdown-count">
              {unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}
            </span>
          </div>

          <div className="notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.isRead ? 'notif-item-read' : 'notif-item-unread'}`}
                  onClick={() => handleNotificationClick(n)}
                  style={!n.isRead ? { cursor: 'pointer' } : {}}
                >
                  <div className="notif-item-icon">{getNotificationIcon(n.notificationType)}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{formatTime(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>

          <div className="notif-dropdown-footer">
            <button
              className="notif-clear-btn"
              onClick={async () => {
                const unreadNotifs = notifications.filter(n => !n.isRead);
                if (unreadNotifs.length > 0) {
                  try {
                    await Promise.all(
                      unreadNotifs.map(n => markNotificationReadApi(n.id, recipientType))
                    );
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}
            >
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
