import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getClientsApi, deleteClientApi, searchClientsApi, getDeletedClientsApi, enableClientApi, downloadBulkImportTemplateApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import BulkImportModal from '../components/BulkImportModal';

const ClientManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [committedSearchQuery, setCommittedSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await downloadBulkImportTemplateApi();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `Client_Bulk_Import_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      let data;
      const params = { page, size, sort: 'id,desc' };
      
      if (showDeleted) {
        data = await getDeletedClientsApi(params);
      } else if (committedSearchQuery.trim()) {
        data = await searchClientsApi({ ...params, query: committedSearchQuery });
      } else {
        data = await getClientsApi(params);
      }
      
      setClients(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, size, showDeleted, committedSearchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Batch both state updates — useEffect fires once, no duplicate API call
    setCommittedSearchQuery(searchQuery);
    setPage(0);
  };

  const handleRestore = async (id) => {
    try {
      await enableClientApi(id);
      toast.success('Client restored');
      fetchClients();
    } catch (err) {
      toast.error(err.message || 'Failed to restore client');
    }
  };

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
    } catch (err) {
      toast.error(err.message || 'Failed to delete client');
    }
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  const renderDate = (clientObj) => {
    // 1. Check for nested object
    if (clientObj.dateOfMembership && typeof clientObj.dateOfMembership === 'object' && clientObj.dateOfMembership.bsDate) {
      return clientObj.dateOfMembership.bsDate;
    }
    // 2. Check for common field names
    const fields = ['dateOfMembershipBs', 'dateOfMembership', 'membershipDate', 'membershipDateBs'];
    for (const field of fields) {
      if (clientObj[field] && typeof clientObj[field] === 'string') return clientObj[field];
    }
    return '—';
  };

  if (loading && clients.length === 0) return <LoadingSpinner />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Client Management (ग्राहक व्यवस्थापन)</h1>
          <p className="page-subtitle">Manage your cooperative clients</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
          >
            {downloadingTemplate ? 'Downloading...' : 'Download Template'}
          </button>
          <button className="btn btn-outline" onClick={() => setIsBulkImportModalOpen(true)}>Bulk Import</button>
          <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>+ Add Client</button>
        </div>
      </div>

      <BulkImportModal 
        isOpen={isBulkImportModalOpen} 
        onClose={() => setIsBulkImportModalOpen(false)} 
        onSuccess={fetchClients} 
      />

      <div className="modern-search-card">
        <form onSubmit={handleSearch} className="modern-search-form">
          <div className="modern-search-wrapper">
            <svg className="modern-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search clients by name, membership ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={showDeleted}
            />
          </div>
          <button type="submit" className="modern-search-btn" disabled={showDeleted}>Search</button>
        </form>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label className={`modern-toggle-wrapper ${showDeleted ? 'active' : ''}`}>
            <input
              type="checkbox"
              className="modern-toggle-input"
              checked={showDeleted}
              onChange={(e) => {
                setShowDeleted(e.target.checked);
                setPage(0);
                setSearchQuery('');
                setCommittedSearchQuery('');
              }}
            />
            {showDeleted ? 'Showing Deleted Records' : 'Show Deleted'}
          </label>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Membership ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Citizenship No</th>
                <th>Membership Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No clients found. Click "Add Client" to create one.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.membershipId}</td>
                    <td>{client.fullNameEnglish || client.fullNameNepali}</td>
                    <td>{client.mobileNumber}</td>
                    <td>{client.gender || '—'}</td>
                    <td>{client.citizenshipNumber}</td>
                    <td>{renderDate(client)}</td>
                    <td>
                      <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        {showDeleted ? (
                          <button className="btn btn-sm btn-success" onClick={() => handleRestore(client.id)}>
                            Restore
                          </button>
                        ) : (
                          <>
                            {!client.isActive && (
                              <button className="btn btn-sm btn-success" onClick={() => handleRestore(client.id)}>
                                Enable
                              </button>
                            )}
                            <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clients/${client.id}`)}>
                              View
                            </button>
                            <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                              Edit
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(client.id)}>
                              Delete
                            </button>
                          </>
                        )}
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
