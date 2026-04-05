import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getLoansApi } from '../services/api';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import cache from '../utils/cache';

const LoanManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLoans = async (forceRefresh = false) => {
    const cacheKey = `loans:list:${page}:${size}`;
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setLoans(cached.content || []);
        setTotalPages(cached.totalPages || 0);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const data = await getLoansApi({ page, size, sort: 'id,desc' });
      cache.set(cacheKey, data, 300);
      setLoans(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, size]);

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  if (loading && loans.length === 0) return <TableSkeleton cols={6} rows={5} />;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Loans Management (कर्जा व्यवस्थापन)</h1>
          <p className="page-subtitle">Manage all client loans from here</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/loans/new')}>
          + Add Loan
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Membership ID</th>
                <th>Client Name</th>
                <th>Contact</th>
                <th>Repayment Date (BS)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No loans found. Click "Add Loan" to create one.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.id}</td>
                    <td>{loan.membershipId}</td>
                    <td>{loan.clientNameNepali}</td>
                    <td>{loan.contactNumber}</td>
                    <td>{loan.loanRepaymentDateBs}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/loans/${loan.id}`)}>
                          View
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/loans/${loan.id}/edit`)}>
                          Edit
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

export default LoanManagement;
