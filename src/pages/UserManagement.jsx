import { useState, useEffect } from 'react';
import { getUsersApi, approveUserApi, rejectUserApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveUserApi(id);
      toast.success('User approved successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await rejectUserApi(id);
      toast.success('User rejected');
      fetchUsers();
    } catch {
      toast.error('Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      approved: 'badge badge-success',
      pending: 'badge badge-warning',
      rejected: 'badge badge-danger',
      new: 'badge badge-info',
    };
    return <span className={classes[status] || 'badge'}>{status}</span>;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-content">
      <h1>User Management</h1>
      <p className="page-subtitle">Manage registered users</p>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.organization || '—'}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user.status === 'pending' && (
                        <div className="action-btns">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleApprove(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? '...' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleReject(user.id)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      )}
                      {user.status !== 'pending' && (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
