import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsersApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const STATUS_TABS = [
  { key: 'p', label: 'Pending', icon: '⏳' },
  { key: 'a', label: 'Accepted', icon: '✅' },
  { key: 'r', label: 'Rejected', icon: '❌' },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('p');
  const toast = useToast();
  const navigate = useNavigate();

  const fetchUsers = async (status) => {
    setLoading(true);
    try {
      const data = await getAdminUsersApi(status);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleRowClick = (sessionId) => {
    navigate(`/admin/users/${sessionId}`, { state: { status: activeTab } });
  };

  const getStatusLabel = (key) => {
    const tab = STATUS_TABS.find((t) => t.key === key);
    return tab ? tab.label : key;
  };

  return (
    <div className="page-content">
      <h1>User Management</h1>
      <p className="page-subtitle">Manage registered users by status</p>

      {/* Status Tabs */}
      <div className="status-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3>{getStatusLabel(activeTab)} Users</h3>
          <button className="btn btn-sm btn-outline" onClick={() => fetchUsers(activeTab)}>
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
                  <th>Contact Number</th>
                  <th>Authorized Person</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No {getStatusLabel(activeTab).toLowerCase()} users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.onboardingSessionId}
                      className="clickable-row"
                      onClick={() => handleRowClick(user.onboardingSessionId)}
                    >
                      <td>
                        <span className="user-company-name">{user.companyNameEnglish || '—'}</span>
                      </td>
                      <td>{user.contactNumber || '—'}</td>
                      <td>{user.authorizedPersonNameEnglish || '—'}</td>
                      <td>
                        <button className="btn btn-sm btn-primary">View Details →</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
