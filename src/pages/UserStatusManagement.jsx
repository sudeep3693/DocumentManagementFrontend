import { useState, useEffect, useCallback } from 'react';
import { getAdminAllUsersApi, getAdminPublishedUsersApi, updateUserStatusApi, getAdminUserByIdApi, getNotificationAvailabilityApi, getUserProfileApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import NepaliDatePickerWrapper from '../components/NepaliDatePickerWrapper';
import { useAuth } from '../context/AuthContext';

const FILTER_TABS = [
  { key: 'all', label: 'All Users', icon: '👥' },
  { key: 'published', label: 'Published', icon: '✅' },
  { key: 'unpublished', label: 'Unpublished', icon: '🚫' },
];

const formatDate = (dateObj) => {
  if (!dateObj) return '—';
  if (typeof dateObj === 'string') {
    try {
      return new Date(dateObj).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateObj;
    }
  }
  return `${dateObj.bsDate || ''} ${dateObj.adDate ? `(${new Date(dateObj.adDate).toLocaleDateString()})` : ''}`.trim() || '—';
};

const toDateInputValue = (dateObj) => {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') return dateObj;
  return dateObj.bsDate || '';
};

const UserStatusManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editingUserDetails, setEditingUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editPublished, setEditPublished] = useState(false);
  const [editActiveUntil, setEditActiveUntil] = useState('');
  
  // Notification limits
  const [editSmsUpdate, setEditSmsUpdate] = useState(0);
  const [editEmailUpdate, setEditEmailUpdate] = useState(0);
  
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [adminQuota, setAdminQuota] = useState(null);

  useEffect(() => {
    const fetchAdminQuota = async () => {
      try {
        const quotaData = await getNotificationAvailabilityApi();
        setAdminQuota(quotaData);
      } catch (err) {
        console.error('Failed to load admin notification quota', err);
      }
    };
    fetchAdminQuota();
  }, []);

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
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
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

  const openEditModal = async (user) => {
    setEditingUser(user);
    setEditPublished(user.published ?? false);
    // Keep the entire date object so adDate is preserved
    setEditActiveUntil(user.activeUntil || '');
    
    // Fetch full details for notification availability
    setDetailsLoading(true);
    setEditingUserDetails(null);
    setEditSmsUpdate(0);
    setEditEmailUpdate(0);
    try {
      const details = await getAdminUserByIdApi(user.userId);
      setEditingUserDetails(details);
    } catch (err) {
      toast.error('Failed to load user complete details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditingUserDetails(null);
    setEditPublished(false);
    setEditActiveUntil('');
    setEditSmsUpdate(0);
    setEditEmailUpdate(0);
  };

  const handleSaveStatus = async () => {
    if (!editingUser) return;

    setSubmitting(true);
    try {
      const activeUntilPayload = typeof editActiveUntil === 'object' ? {
        bsDate: editActiveUntil.bsDate,
        adDate: editActiveUntil.adDate ? new Date(editActiveUntil.adDate).toISOString() : null
      } : {
        bsDate: editActiveUntil || null,
        adDate: null
      };

      const payload = {
        userId: editingUser.userId,
        published: editPublished,
        activeUntil: activeUntilPayload,
      };

      payload.smsAllowed = editingUserDetails?.notificationAvailability?.smsAvailable || 0;
      payload.emailAllowed = editingUserDetails?.notificationAvailability?.emailAvailable || 0;
      payload.smsUpdate = parseInt(editSmsUpdate, 10) || 0;
      payload.emailUpdate = parseInt(editEmailUpdate, 10) || 0;

      await updateUserStatusApi(payload);

      toast.success('User status updated successfully');
      closeEditModal();
      fetchUsers(activeFilter);
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <h1>User Status Management</h1>
      <p className="page-subtitle">Manage published status and validity period for accepted users</p>

      {adminQuota && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="notification-limits-card" style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💬</span> Admin SMS Quota
                </h4>
                <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.9rem', color: '#3b82f6' }}>
                  Remaining: <strong>{adminQuota.smsAvailable}</strong> | Used: <strong>{adminQuota.smsUsedTillTheDate}</strong>
                </p>
              </div>
              <div>
                <span className={`badge ${adminQuota.smsIsActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem' }}>
                  {adminQuota.smsIsActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="notification-limits-card" style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📧</span> Admin Email Quota
                </h4>
                <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.9rem', color: '#3b82f6' }}>
                  Remaining: <strong>{adminQuota.emailAvailable}</strong> | Used: <strong>{adminQuota.emailUsedTillTheDate}</strong>
                </p>
              </div>
              <div>
                <span className={`badge ${adminQuota.emailIsActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem' }}>
                  {adminQuota.emailIsActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {/* Notification Limits */}
              {detailsLoading ? (
                <div className="form-group" style={{ textAlign: 'center', padding: '1rem' }}>
                  <LoadingSpinner />
                  <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Loading notification details...</p>
                </div>
              ) : editingUserDetails && (
                <div className="notification-limits-card" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>✉️</span> Notification Allocations
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem' }}>SMS Remaining (Used)</label>
                      <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                        {editingUserDetails.notificationAvailability?.smsAvailable || 0} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>({editingUserDetails.notificationAvailability?.smsUsedTillTheDate || 0} used)</span>
                      </div>
                      <label style={{ fontSize: '0.85rem' }}>Add/Reduce SMS Quota</label>
                      <input 
                        type="number" 
                        value={editSmsUpdate}
                        onChange={(e) => setEditSmsUpdate(e.target.value)}
                        className="form-input"
                        placeholder="e.g. 10 or -5"
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.85rem' }}>Email Remaining (Used)</label>
                      <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                        {editingUserDetails.notificationAvailability?.emailAvailable || 0} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>({editingUserDetails.notificationAvailability?.emailUsedTillTheDate || 0} used)</span>
                      </div>
                      <label style={{ fontSize: '0.85rem' }}>Add/Reduce Email Quota</label>
                      <input 
                        type="number" 
                        value={editEmailUpdate}
                        onChange={(e) => setEditEmailUpdate(e.target.value)}
                        className="form-input"
                        placeholder="e.g. 10 or -5"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                <label>Active Until (BS)</label>
                <NepaliDatePickerWrapper
                  name="editActiveUntil"
                  value={typeof editActiveUntil === 'object' ? editActiveUntil.bsDate : editActiveUntil}
                  onChange={(e) => setEditActiveUntil(e.target.value)}
                  className="form-input"
                />
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
