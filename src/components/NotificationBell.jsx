import { useState, useEffect, useRef } from 'react';

// ─── Mock API ───────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New Loan Approved',
    message: 'Loan #LN-2081-045 for Ram Bahadur Thapa has been approved.',
    time: '2 mins ago',
    icon: '💰',
    read: false,
  },
  {
    id: 2,
    title: 'Client Profile Updated',
    message: 'Sita Devi Sharma updated her contact information.',
    time: '1 hour ago',
    icon: '👤',
    read: false,
  },
  {
    id: 3,
    title: 'Tamsuk Generated',
    message: 'Document for Loan #LN-2081-032 has been generated successfully.',
    time: '3 hours ago',
    icon: '📄',
    read: true,
  },
  {
    id: 4,
    title: 'New Notice Posted',
    message: 'Admin posted: Annual General Meeting scheduled for 2081-03-15.',
    time: 'Yesterday',
    icon: '📢',
    read: true,
  },
];

const fetchNotifications = () =>
  Promise.resolve([...MOCK_NOTIFICATIONS]);

// ─── Component ───────────────────────────────────────────────
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const ref = useRef(null);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

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

  const unreadCount = notifications.filter(
    (n) => !n.read && !readIds.has(n.id)
  ).length;

  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) {
      // Mark all as read when opening
      const allIds = new Set(notifications.map((n) => n.id));
      setReadIds(allIds);
    }
  };

  const isRead = (n) => n.read || readIds.has(n.id);

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
                  className={`notif-item ${isRead(n) ? 'notif-item-read' : 'notif-item-unread'}`}
                >
                  <div className="notif-item-icon">{n.icon}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{n.time}</div>
                  </div>
                  {!isRead(n) && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>

          <div className="notif-dropdown-footer">
            <button
              className="notif-clear-btn"
              onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))}
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
