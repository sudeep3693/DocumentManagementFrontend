import { useState } from 'react';

// ─── Mock Data ───────────────────────────────────────────────
const TAKETA_TYPES = [
  { key: 'taketa1', label: 'Taketa 1', labelNp: 'तमसुक १', icon: '📄' },
  { key: 'taketa2', label: 'Taketa 2', labelNp: 'तमसुक २', icon: '📋' },
  { key: 'taketa3', label: 'Taketa 3', labelNp: 'तमसुक ३', icon: '📑' },
];

const generateMockRecords = (type) => [
  {
    id: 1, clientName: 'राम बहादुर थापा', clientNameEn: 'Ram Bahadur Thapa',
    membershipId: 'MEM-2081-001', amount: 500000, date: '2081-06-15',
    remarks: 'First installment approved', status: 'Active', type,
  },
  {
    id: 2, clientName: 'सीता देवी शर्मा', clientNameEn: 'Sita Devi Sharma',
    membershipId: 'MEM-2081-008', amount: 300000, date: '2081-07-02',
    remarks: 'Renewed taketa', status: 'Active', type,
  },
  {
    id: 3, clientName: 'हरि प्रसाद पौडेल', clientNameEn: 'Hari Prasad Poudel',
    membershipId: 'MEM-2080-042', amount: 750000, date: '2081-05-20',
    remarks: 'Long-term loan document', status: 'Completed', type,
  },
  {
    id: 4, clientName: 'कमला कुमारी गुरुङ', clientNameEn: 'Kamala Kumari Gurung',
    membershipId: 'MEM-2080-019', amount: 200000, date: '2081-08-10',
    remarks: 'Small business loan', status: 'Active', type,
  },
  {
    id: 5, clientName: 'विष्णु प्रसाद अधिकारी', clientNameEn: 'Bishnu Prasad Adhikari',
    membershipId: 'MEM-2079-007', amount: 1000000, date: '2080-12-01',
    remarks: 'Commercial property loan', status: 'Completed', type,
  },
  {
    id: 6, clientName: 'मनिषा राई', clientNameEn: 'Manisha Rai',
    membershipId: 'MEM-2081-015', amount: 150000, date: '2081-09-05',
    remarks: 'Agricultural loan', status: 'Active', type,
  },
];

const MOCK_RECORDS = {
  taketa1: generateMockRecords('taketa1'),
  taketa2: generateMockRecords('taketa2').map((r, i) => ({ ...r, id: 10 + i, amount: r.amount * 1.2 })),
  taketa3: generateMockRecords('taketa3').map((r, i) => ({ ...r, id: 20 + i, amount: r.amount * 0.8 })),
};

const EMPTY_FORM = {
  clientName: '', membershipId: '', amount: '', date: '', remarks: '', purpose: '',
};

const PAGE_SIZE = 4;

// ─── Sub-components ──────────────────────────────────────────
const formatNPR = (n) => `NPR ${Number(n).toLocaleString('en-IN')}`;

const TaketaCreateForm = ({ type, onCreated }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientName || !form.amount || !form.date) return;
    onCreated({ ...form, id: Date.now(), status: 'Active', type });
    setForm(EMPTY_FORM);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="taketa-form-card">
      <div className="taketa-form-header">
        <span>✍️</span>
        <div>
          <h3>Create New {TAKETA_TYPES.find(t => t.key === type)?.label}</h3>
          <p>Fill in the details to create a new document record</p>
        </div>
      </div>

      {saved && (
        <div className="taketa-success-banner">
          ✅ Taketa created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="taketa-form-grid">
        <div className="form-group">
          <label>Client Name (नाम) *</label>
          <input name="clientName" value={form.clientName} onChange={handleChange}
            placeholder="Ram Bahadur Thapa / राम बहादुर थापा" required />
        </div>
        <div className="form-group">
          <label>Membership ID *</label>
          <input name="membershipId" value={form.membershipId} onChange={handleChange}
            placeholder="MEM-2081-001" />
        </div>
        <div className="form-group">
          <label>Loan Amount (NPR) *</label>
          <input name="amount" type="number" value={form.amount} onChange={handleChange}
            placeholder="500000" required />
        </div>
        <div className="form-group">
          <label>Issue Date (BS) *</label>
          <input name="date" value={form.date} onChange={handleChange}
            placeholder="2081-06-15" required />
        </div>
        <div className="form-group">
          <label>Purpose of Loan</label>
          <input name="purpose" value={form.purpose} onChange={handleChange}
            placeholder="Agriculture / Business / Personal..." />
        </div>
        <div className="form-group">
          <label>Remarks</label>
          <input name="remarks" value={form.remarks} onChange={handleChange}
            placeholder="Additional notes..." />
        </div>
        <div className="taketa-form-footer">
          <button type="submit" className="btn btn-primary">
            <span>📄</span> Create {TAKETA_TYPES.find(t => t.key === type)?.label}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setForm(EMPTY_FORM)}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

const TaketaRecordsTable = ({ records }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pageData = records.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="taketa-records-card">
      <div className="taketa-records-header">
        <div>
          <h3>📋 Existing Records</h3>
          <p>{records.length} total records</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="taketa-empty">No records yet. Create one above.</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client Name</th>
                  <th>Membership ID</th>
                  <th>Amount</th>
                  <th>Date (BS)</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r, i) => (
                  <tr key={r.id}>
                    <td>{page * PAGE_SIZE + i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{r.clientName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>{r.clientNameEn}</div>
                    </td>
                    <td><code style={{ fontSize: '0.8rem', color: 'var(--primary-600)' }}>{r.membershipId}</code></td>
                    <td style={{ fontWeight: 600 }}>{formatNPR(r.amount)}</td>
                    <td>{r.date}</td>
                    <td>
                      <span className={`badge ${r.status === 'Active' ? 'badge-success' : 'badge-info'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="taketa-pagination">
              <button className="btn btn-sm btn-outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                ← Prev
              </button>
              <span className="taketa-page-info">Page {page + 1} of {totalPages}</span>
              <button className="btn btn-sm btn-outline" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────
const TaketaPage = () => {
  const [activeType, setActiveType] = useState('taketa1');
  const [allRecords, setAllRecords] = useState(MOCK_RECORDS);

  const handleCreated = (newRecord) => {
    setAllRecords(prev => ({
      ...prev,
      [activeType]: [newRecord, ...prev[activeType]],
    }));
  };

  const currentRecords = allRecords[activeType] || [];

  return (
    <div className="taketa-layout">
      {/* Left sidebar */}
      <aside className="taketa-sidebar">
        <div className="taketa-sidebar-header">
          <div className="taketa-sidebar-title">
            <span>📄</span>
            <div>
              <h2>Taketa</h2>
              <p>तमसुक</p>
            </div>
          </div>
        </div>
        <nav className="taketa-sidebar-nav">
          {TAKETA_TYPES.map((t) => (
            <button
              key={t.key}
              className={`taketa-nav-item ${activeType === t.key ? 'active' : ''}`}
              onClick={() => setActiveType(t.key)}
            >
              <span className="taketa-nav-icon">{t.icon}</span>
              <div className="taketa-nav-text">
                <span className="taketa-nav-label">{t.label}</span>
                <span className="taketa-nav-sublabel">{t.labelNp}</span>
              </div>
              <span className="taketa-nav-count">{allRecords[t.key]?.length || 0}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="taketa-main">
        <div className="taketa-main-header">
          <h1>
            {TAKETA_TYPES.find(t => t.key === activeType)?.icon}{' '}
            {TAKETA_TYPES.find(t => t.key === activeType)?.label}
          </h1>
          <p className="page-subtitle">
            Create and manage {TAKETA_TYPES.find(t => t.key === activeType)?.label} (
            {TAKETA_TYPES.find(t => t.key === activeType)?.labelNp}) records
          </p>
        </div>

        <TaketaCreateForm type={activeType} onCreated={handleCreated} />
        <div style={{ marginTop: '1.5rem' }}>
          <TaketaRecordsTable records={currentRecords} />
        </div>
      </main>
    </div>
  );
};

export default TaketaPage;
