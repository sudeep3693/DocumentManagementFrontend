import { useState, useEffect, useCallback } from 'react';
import { getClientsApi, searchClientsApi, getClientHistoryApi } from '../services/api';
import { useToast } from '../context/ToastContext';

// ─── Field Component ─────────────────────────────────────────
const Field = ({ label, value }) => (
  <div className="history-field">
    <div className="history-field-label">{label}</div>
    <div className="history-field-value">{value || '—'}</div>
  </div>
);

const Section = ({ icon, title, color = 'var(--primary-500)', children }) => (
  <div className="history-section">
    <div className="history-section-header" style={{ borderLeftColor: color }}>
      <span>{icon}</span>
      <h4>{title}</h4>
    </div>
    <div className="history-section-body">
      {children}
    </div>
  </div>
);

// ─── Client Detail Panel ─────────────────────────────────────
const ClientDetail = ({ history, loadingHistory }) => {
  if (loadingHistory) {
    return (
      <div className="history-detail-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading history...</p>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="history-empty-state">
        <div className="history-empty-icon">🏢</div>
        <h3>Select a Client</h3>
        <p>Search and select a client from the left panel to view their full details.</p>
      </div>
    );
  }

  return (
    <div className="history-detail-panel">
      {/* Header */}
      <div className="history-detail-header">
        <div className="history-detail-avatar">
          {history.fullNameEnglish ? history.fullNameEnglish.charAt(0).toUpperCase() : (history.fullNameNepali ? history.fullNameNepali.charAt(0) : 'U')}
        </div>
        <div className="history-detail-title">
          <h3>{history.fullNameNepali}</h3>
          <p>{history.fullNameEnglish}</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            <span className={`badge ${history.isActive ? 'badge-success' : 'badge-danger'}`}>
              {history.isActive ? '● Active' : '● Inactive'}
            </span>
            <code style={{ fontSize: '0.75rem', color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              {history.membershipId}
            </code>
          </div>
        </div>
        <a
          href="#"
          className="btn btn-sm btn-outline history-pdf-btn"
          style={{ opacity: 0.45, pointerEvents: 'none', marginLeft: 'auto', cursor: 'not-allowed' }}
          title="PDF download (disabled)"
        >
          📥 PDF
        </a>
      </div>

      <div className="history-detail-sections">
        <Section icon="👤" title="Basic Information" color="var(--primary-500)">
          <Field label="Full Name (English)" value={history.fullNameEnglish} />
          <Field label="पूरा नाम (Nepali)" value={history.fullNameNepali} />
          <Field label="Membership Date (BS)" value={history.dateOfMembershipBs} />
          <Field label="Membership Date (AD)" value={history.dateOfMembershipAd} />
        </Section>

        <Section icon="🪪" title="Shares Information" color="var(--info-500)">
          <Field label="Share Amount" value={history.shareAmount ? `NPR ${history.shareAmount.toLocaleString('en-IN')}` : '0'} />
          <Field label="Share Number" value={history.shareNumber} />
          <Field label="Certificate No" value={history.shareCertificateNumber} />
        </Section>

        {history.loans?.content?.length > 0 && (
          <Section icon="💰" title="Loans Taken" color="var(--warning-500)">
            {history.loans.content.map((loan, idx) => (
              <div key={loan.loanId || idx} style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Loan ID: {loan.loanId}</strong>
                  <span className={`badge ${loan.isCompleted ? 'badge-success' : 'badge-warning'}`}>
                    {loan.isCompleted ? 'Completed' : 'Active'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Field label="Amount" value={loan.loanAmount} />
                  <Field label="Remaining" value={loan.loanRemainingToBePaid} />
                  <Field label="Issued Date (BS)" value={loan.loanIssuedDateBs} />
                  <Field label="Repay Date (BS)" value={loan.repayDateBs} />
                  <Field label="Purpose" value={loan.purposeOfLoan} />
                  <Field label="Interest Rate" value={`${loan.interestRate} (${loan.interestRateFormat})`} />
                  <Field label="Repayment Type" value={loan.loanRepaymentType} />
                </div>
                {loan.isCompleted && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <Field label="Repaid Date (BS)" value={loan.repaidDateBs} />
                    <Field label="Completion Message" value={loan.completionMessage} />
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {history.dhanjamaniAsGuarantor?.content?.length > 0 && (
          <Section icon="🤝" title="As Guarantor (Dhanjamani)" color="var(--success-500)">
            {history.dhanjamaniAsGuarantor.content.map((g, idx) => (
              <div key={idx} style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Guaranteed Loan ID: {g.loanId}</strong>
                  <span className={`badge ${g.isLoanCompleted ? 'badge-success' : 'badge-warning'}`}>
                    {g.isLoanCompleted ? 'Loan Completed' : 'Loan Active'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Field label="Loan Taker Name" value={g.loanTakerFullNameNepali} />
                  <Field label="Loan Taker ID" value={g.loanTakerMembershipId} />
                  <Field label="Guaranteed Amount" value={g.amountOfDhanjamani} />
                  <Field label="Dhanjamani Date (BS)" value={g.dhanjamaniDateBs} />
                  <Field label="Original Loan Amount" value={g.loanAmount} />
                  <Field label="Loan Issue Date (BS)" value={g.loanIssuedDateBs} />
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
const ClientHistoryPage = () => {
  const [query, setQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const toast = useToast();

  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const params = { page, size: 10, sort: 'id,desc' };
      let data;
      if (committedQuery.trim()) {
        data = await searchClientsApi({ ...params, query: committedQuery });
      } else {
        data = await getClientsApi(params);
      }
      setClients(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  }, [page, committedQuery, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCommittedQuery(query);
    setPage(0);
    setSelectedClient(null);
    setClientHistory(null);
  };

  const handleClearSearch = () => {
    setQuery('');
    setCommittedQuery('');
    setPage(0);
    setSelectedClient(null);
    setClientHistory(null);
  };

  const fetchHistory = async (client) => {
    setSelectedClient(client);
    setLoadingHistory(true);
    setClientHistory(null);
    try {
      const data = await getClientHistoryApi(client.id);
      setClientHistory(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load client history');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="history-layout">
      {/* Left panel */}
      <aside className="history-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="history-sidebar-header" style={{ flexShrink: 0 }}>
          <h2>🏢 Client History</h2>
          <p>ग्राहक इतिहास</p>
        </div>

        <div className="history-search-wrap" style={{ flexShrink: 0 }}>
          <form onSubmit={handleSearch} className="history-search-box">
            <span className="history-search-icon">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, ID..."
              className="history-search-input"
            />
            {query && (
              <button type="button" className="history-search-clear" onClick={handleClearSearch}>✕</button>
            )}
          </form>
        </div>

        <div className="history-list" style={{ flexGrow: 1, overflowY: 'auto' }}>
          {loadingClients ? (
            <div className="history-list-empty">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="history-list-empty">No clients found</div>
          ) : (
            clients.map(c => (
              <button
                key={c.id}
                className={`history-list-item ${selectedClient?.id === c.id ? 'active' : ''}`}
                onClick={() => fetchHistory(c)}
              >
                <div className="history-list-avatar">
                  {c.fullNameEnglish ? c.fullNameEnglish.charAt(0).toUpperCase() : (c.fullNameNepali ? c.fullNameNepali.charAt(0) : 'U')}
                </div>
                <div className="history-list-info">
                  <div className="history-list-name">{c.fullNameNepali || c.fullNameEnglish}</div>
                  <div className="history-list-sub">{c.membershipId}</div>
                </div>
                <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </button>
            ))
          )}
        </div>
        
        {/* Pagination controls for sidebar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--gray-200)', flexShrink: 0 }}>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={page === 0 || loadingClients} 
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </button>
            <span style={{ fontSize: '0.85rem' }}>{page + 1} / {totalPages}</span>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={page >= totalPages - 1 || loadingClients} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </aside>

      {/* Right panel */}
      <main className="history-main">
        {selectedClient ? (
          <ClientDetail history={clientHistory} loadingHistory={loadingHistory} />
        ) : (
          <div className="history-empty-state">
            <div className="history-empty-icon">🏢</div>
            <h3>Select a Client</h3>
            <p>Search and select a client from the left panel to view their full details.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ClientHistoryPage;
