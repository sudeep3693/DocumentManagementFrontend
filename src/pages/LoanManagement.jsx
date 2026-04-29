import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getLoansApi, completeLoanApi } from '../services/api';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import cache from '../utils/cache';
import NepaliDatePickerWrapper, { getTodayBs, formatBs, formatAd } from '../components/NepaliDatePickerWrapper';

const LoanManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [isCompletedView, setIsCompletedView] = useState(false);

  // Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    repaidDate: { bsDate: '', adDate: '' },
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLoans = async (forceRefresh = false) => {
    const cacheKey = `loans:list:${isCompletedView}:${page}:${size}`;
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
      const data = await getLoansApi({ completed: isCompletedView, page, size, sort: 'id,desc' });
      cache.set(cacheKey, data, 300);
      setLoans(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  // When view changes, reset to page 0
  useEffect(() => {
    setPage(0);
  }, [isCompletedView]);

  useEffect(() => {
    fetchLoans();
  }, [page, size, isCompletedView]);

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(p => p - 1);
  };

  const openCompleteModal = (loanId) => {
    setSelectedLoanId(loanId);
    const today = getTodayBs();
    const todayBsStr = formatBs(today.year, today.month, today.day);
    const todayAdStr = formatAd(new Date());

    setCompleteForm({
      repaidDate: { bsDate: todayBsStr, adDate: todayAdStr },
      message: 'Loan fully repaid'
    });
    setCompleteModalOpen(true);
  };

  const closeCompleteModal = () => {
    setCompleteModalOpen(false);
    setSelectedLoanId(null);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeForm.message) {
      toast.error('Message is required');
      return;
    }
    if (!completeForm.repaidDate.bsDate || !completeForm.repaidDate.adDate) {
      toast.error('Repaid date is required');
      return;
    }
    
    setSubmitting(true);
    try {
      await completeLoanApi(selectedLoanId, completeForm);
      toast.success('Loan marked as completed successfully!');
      
      cache.invalidateByPrefix('loans:list:');
      
      closeCompleteModal();
      fetchLoans(true);
    } catch (err) {
      toast.error(err.message || 'Failed to complete loan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    setCompleteForm(prev => ({
      ...prev,
      repaidDate: value || { bsDate: '', adDate: '' }
    }));
  };

  const activeButtonStyle = {
    backgroundColor: 'var(--primary-600)',
    color: '#fff',
    borderColor: 'var(--primary-600)'
  };
  const inactiveButtonStyle = {
    backgroundColor: '#fff',
    color: 'var(--gray-600)',
    borderColor: 'var(--gray-300)'
  };

  // Modal backdrop styling
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
    zIndex: 999
  };

  const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    width: '100%',
    maxWidth: '480px',
    boxShadow: 'var(--shadow-xl)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  if (loading && loans.length === 0) return <TableSkeleton cols={6} rows={5} />;

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Loans Management (कर्जा व्यवस्थापन)</h1>
          <p className="page-subtitle">Manage all client loans from here</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', padding: '4px', backgroundColor: 'var(--gray-100)', borderRadius: 'var(--radius-md)' }}>
            <button 
              className="btn btn-sm"
              style={!isCompletedView ? activeButtonStyle : inactiveButtonStyle}
              onClick={() => setIsCompletedView(false)}
            >
              Active
            </button>
            <button 
              className="btn btn-sm"
              style={isCompletedView ? activeButtonStyle : inactiveButtonStyle}
              onClick={() => setIsCompletedView(true)}
            >
              Completed
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/loans/new')}>
            + Add Loan
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Effective Loan ID</th>
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
                  <td colSpan="6" className="empty-state">
                    No loans found. Click "Add Loan" to create one.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.loanId}</td>
                    <td>{loan.membershipId}</td>
                    <td>{loan.clientNameNepali}</td>
                    <td>{loan.contactNumber}</td>
                    <td>{loan.loanRepaymentDateBs}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-sm btn-outline" onClick={() => navigate(`/loans/${loan.id}`)}>
                          View
                        </button>
                        {!isCompletedView && (
                          <>
                            <button className="btn btn-sm btn-outline" onClick={() => navigate(`/loans/${loan.id}/edit`)}>
                              Edit
                            </button>
                            <button className="btn btn-sm" style={{ backgroundColor: 'var(--success-500)', color: '#fff', borderColor: 'var(--success-500)' }} onClick={() => openCompleteModal(loan.id)}>
                              Complete
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

      {/* Complete Loan Modal */}
      {completeModalOpen && (
        <div style={modalOverlayStyle} onClick={closeCompleteModal}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-200)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Complete Loan</h2>
              <button 
                onClick={closeCompleteModal} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>
                  Repayment Date (मिति) <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <NepaliDatePickerWrapper
                  name="repaidDate"
                  value={completeForm.repaidDate}
                  onChange={handleDateChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500, fontSize: '0.875rem' }}>
                  Message (सन्देश) <span style={{ color: 'var(--danger-500)' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={completeForm.message}
                  onChange={(e) => setCompleteForm({ ...completeForm, message: e.target.value })}
                  placeholder="Enter a descriptive message..."
                  required
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={closeCompleteModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Completing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;

