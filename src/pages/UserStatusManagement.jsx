import { useState, useEffect, useCallback } from 'react';
import { getAdminAllUsersApi, getAdminPublishedUsersApi, updateUserStatusApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const FILTER_TABS = [
  { key: 'all', label: 'All Users', icon: '👥' },
  { key: 'published', label: 'Published', icon: '✅' },
  { key: 'unpublished', label: 'Unpublished', icon: '🚫' },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const toDateInputValue = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const UserStatusManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editPublished, setEditPublished] = useState(false);
  const [editActiveUntil, setEditActiveUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const fetchUsers = useCallback(async (filter) => {
    setLoading(true);
    try {
      let data;
      if (filter === 'published') {
        data = await getAdminPublishedUsersApi(true);
      } else if (filter === 'unpublished') {
        data = await getAdminPublishedUsersApi(false);
      } else {
        data = await getAdminAllUsersApi();
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers(activeFilter);
  }, [activeFilter, fetchUsers]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditPublished(user.published ?? false);
    setEditActiveUntil(toDateInputValue(user.activeUntil));
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditPublished(false);
    setEditActiveUntil('');
  };

  const handleSaveStatus = async () => {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const activeUntilISO = editActiveUntil
        ? new Date(editActiveUntil + 'T00:00:00').toISOString()
        : null;

      await updateUserStatusApi({
        userId: editingUser.userId,
        published: editPublished,
        activeUntil: activeUntilISO,
      });

      toast.success('User status updated successfully');
      closeEditModal();
      fetchUsers(activeFilter);
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <h1>User Status Management</h1>
      <p className="page-subtitle">Manage published status and validity period for accepted users</p>

      {/* Filter Tabs */}
      <div className="status-tabs">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`status-tab ${activeFilter === tab.key ? 'active' : ''}`}
            onClick={() => handleFilterChange(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3>
            {FILTER_TABS.find((t) => t.key === activeFilter)?.label || 'Users'}
            {!loading && <span className="header-count">({users.length})</span>}
          </h3>
          <button className="btn btn-sm btn-outline" onClick={() => fetchUsers(activeFilter)}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Username</th>
                  <th>Published</th>
                  <th>Active Status</th>
                  <th>Active Until</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No users found for the selected filter
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <span className="user-company-name">
                          {user.companyNameEnglish || '—'}
                        </span>
                      </td>
                      <td>{user.userName || '—'}</td>
                      <td>
                        <span className={`badge ${user.published ? 'badge-success' : 'badge-danger'}`}>
                          {user.published ? 'Published' : 'Unpublished'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.activeStatus ? 'badge-success' : 'badge-warning'}`}>
                          {user.activeStatus ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(user.activeUntil)}</td>
                      <td>{formatDate(user.createdDate)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openEditModal(user)}
                        >
                          ✏️ Edit Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Status Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User Status</h3>
              <button className="modal-close" onClick={closeEditModal}>×</button>
            </div>

            <div className="modal-user-info">
              <div className="modal-info-row">
                <span className="modal-info-label">Company</span>
                <span className="modal-info-value">{editingUser.companyNameEnglish || '—'}</span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">Username</span>
                <span className="modal-info-value">{editingUser.userName || '—'}</span>
              </div>
            </div>

            <div className="modal-form-section">
              {/* Published Toggle */}
              <div className="form-group">
                <label>Published Status</label>
                <div className="toggle-container">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={editPublished}
                      onChange={(e) => setEditPublished(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className={`toggle-label ${editPublished ? 'toggle-active' : 'toggle-inactive'}`}>
                    {editPublished ? 'Published' : 'Unpublished'}
                  </span>
                </div>
              </div>

              {/* Active Until Date */}
              <div className="form-group">
                <label>Active Until</label>
                <input
                  type="date"
                  value={editActiveUntil}
                  onChange={(e) => setEditActiveUntil(e.target.value)}
                  className="form-input"
                />
                <span className="form-hint">Time will be set to midnight (00:00)</span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeEditModal} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveStatus} disabled={submitting}>
                {submitting ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatusManagement;
