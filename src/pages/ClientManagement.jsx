import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getClientsApi, deleteClientApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ClientManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getClientsApi({ page, size, sort: 'id,desc' });
      setClients(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, size]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      await deleteClientApi(id);
      toast.success('Client deleted');
      // If we delete the last item on the page, go to previous page if not on page 0
      if (clients.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        fetchClients();
      }
    } catch {
      toast.error('Failed to delete client');
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  if (loading && clients.length === 0) return <LoadingSpinner />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Client Management</h1>
          <p className="page-subtitle">Manage your cooperative clients</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>+ Add Client</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account No</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Citizenship No</th>
                <th>Membership Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No clients found. Click "Add Client" to create one.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.accountNumber}</td>
                    <td>{client.fullNameEnglish || client.fullNameNepali}</td>
                    <td>{client.mobileNumber}</td>
                    <td>{client.citizenshipNumber}</td>
                    <td>{client.dateOfMembershipBs}</td>
                    <td>
                      <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clients/${client.id}`)}>
                          View
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(client.id)}>
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

export default ClientManagement;
