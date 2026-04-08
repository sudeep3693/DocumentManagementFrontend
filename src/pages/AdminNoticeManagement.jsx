import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getNoticesApi, deleteNoticeApi } from '../services/api';
import TableSkeleton from '../components/skeletons/TableSkeleton';

const AdminNoticeManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const params = { page, size, sort: 'id,desc' };
      const data = await getNoticesApi(params);
      
      setNotices(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [page, size]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteNoticeApi(id);
      toast.success('Notice deleted successfully');
      
      if (notices.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchNotices();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete notice');
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && notices.length === 0) return <TableSkeleton cols={5} rows={5} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Notice Management (सूचना व्यवस्थापन)</h1>
          <p className="page-subtitle">Manage system notifications and updates</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/admin/notices/new')}>
            + Add Notice
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Images</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No notices found. Click "Add Notice" to create one.
                  </td>
                </tr>
              ) : (
                notices.map((notice) => (
                  <tr key={notice.id}>
                    <td>#{notice.id}</td>
                    <td>{notice.title}</td>
                    <td>{notice.images?.length || 0}</td>
                    <td>{formatDate(notice.createdDate)}</td>
                    <td>
                      <span className={`badge ${notice.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {notice.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button 
                          className="btn btn-sm btn-outline" 
                          onClick={() => navigate(`/admin/notices/${notice.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-danger" 
                          onClick={() => handleDelete(notice.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="pagination" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={handlePrevPage}>Previous</button>
            <span>Page {page + 1} of {totalPages}</span>
            <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={handleNextPage}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNoticeManagement;
