import { useState, useMemo } from 'react';

// ─── Mock Loan Data ──────────────────────────────────────────
const MOCK_LOANS = [
  {
    id: 'LN-2081-001',
    clientName: 'Ram Bahadur Thapa',
    clientNameNepali: 'राम बहादुर थापा',
    membershipId: 'MEM-2081-001',
    clientId: 1,
    loanAmount: 500000,
    interestRate: 12,
    interestFormat: 'Monthly Reducing',
    loanRepaymentType: 'Monthly',
    purposeOfLoan: 'Business Expansion',
    loanIssuedDateBs: '2081-04-15',
    repayDateBs: '2082-04-15',
    loanRemainingToBePaid: 480000,
    isTamsukGenerated: true,
    isCompleted: false,
    dhanjamaniDetails: [
      { nameNepali: 'गोपाल थापा', membershipId: 'MEM-2080-014', contactNumber: '9841111111', amountOfDhanjamani: 250000 },
    ],
    sakshiDetails: [
      { fullNameNepali: 'कृष्ण बहादुर', age: 45, gender: 'Male', district: 'Kathmandu', province: 'Bagmati' },
    ],
    clientsDetails: {
      fullNameEnglish: 'Ram Bahadur Thapa', fullNameNepali: 'राम बहादुर थापा',
      membershipId: 'MEM-2081-001', citizenshipNumber: '01-01-01-12345', mobileNumber: '9841234567',
      addresses: [{ addressType: 'P', toleName: 'Baluwatar', wardNo: '10', municipality: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati' }]
    },
  },
  {
    id: 'LN-2081-012',
    clientName: 'Sita Devi Sharma',
    clientNameNepali: 'सीता देवी शर्मा',
    membershipId: 'MEM-2081-008',
    clientId: 2,
    loanAmount: 300000,
    interestRate: 10.5,
    interestFormat: 'Flat Rate',
    loanRepaymentType: 'Quarterly',
    purposeOfLoan: 'Home Renovation',
    loanIssuedDateBs: '2081-06-01',
    repayDateBs: '2083-06-01',
    loanRemainingToBePaid: 295000,
    isTamsukGenerated: true,
    isCompleted: false,
    dhanjamaniDetails: [],
    sakshiDetails: [
      { fullNameNepali: 'माया देवी', age: 38, gender: 'Female', district: 'Lalitpur', province: 'Bagmati' },
    ],
    clientsDetails: {
      fullNameEnglish: 'Sita Devi Sharma', fullNameNepali: 'सीता देवी शर्मा',
      membershipId: 'MEM-2081-008', citizenshipNumber: '03-02-05-67890', mobileNumber: '9851098765',
      addresses: [{ addressType: 'P', toleName: 'Pulchowk', wardNo: '5', municipality: 'Lalitpur', district: 'Lalitpur', province: 'Bagmati' }]
    },
  },
  {
    id: 'LN-2080-007',
    clientName: 'Hari Prasad Poudel',
    clientNameNepali: 'हरि प्रसाद पौडेल',
    membershipId: 'MEM-2080-042',
    clientId: 3,
    loanAmount: 750000,
    interestRate: 14,
    interestFormat: 'Annual',
    loanRepaymentType: 'Once at all',
    purposeOfLoan: 'Agricultural Equipment Purchase',
    loanIssuedDateBs: '2080-08-20',
    repayDateBs: '2081-08-20',
    loanRemainingToBePaid: 0,
    isTamsukGenerated: true,
    isCompleted: true,
    dhanjamaniDetails: [
      { nameNepali: 'लाल बहादुर पौडेल', membershipId: 'MEM-2079-022', contactNumber: '9862222222', amountOfDhanjamani: 400000 },
      { nameNepali: 'मोहन बाबु गुरुङ', membershipId: 'MEM-2079-035', contactNumber: '9843333333', amountOfDhanjamani: 350000 },
    ],
    sakshiDetails: [],
    clientsDetails: {
      fullNameEnglish: 'Hari Prasad Poudel', fullNameNepali: 'हरि प्रसाद पौडेल',
      membershipId: 'MEM-2080-042', citizenshipNumber: '05-03-02-11122', mobileNumber: '9862345678',
      addresses: [{ addressType: 'P', toleName: 'Lakeside', wardNo: '3', municipality: 'Pokhara', district: 'Kaski', province: 'Gandaki' }]
    },
  },
  {
    id: 'LN-2081-023',
    clientName: 'Kamala Kumari Gurung',
    clientNameNepali: 'कमला कुमारी गुरुङ',
    membershipId: 'MEM-2080-019',
    clientId: 4,
    loanAmount: 200000,
    interestRate: 11,
    interestFormat: 'Monthly Reducing',
    loanRepaymentType: 'Monthly',
    purposeOfLoan: 'Small Business',
    loanIssuedDateBs: '2081-07-10',
    repayDateBs: '2082-07-10',
    loanRemainingToBePaid: 198000,
    isTamsukGenerated: false,
    isCompleted: false,
    dhanjamaniDetails: [
      { nameNepali: 'टेक बहादुर गुरुङ', membershipId: 'MEM-2080-030', contactNumber: '9874444444', amountOfDhanjamani: 200000 },
    ],
    sakshiDetails: [
      { fullNameNepali: 'रीता कुमारी', age: 42, gender: 'Female', district: 'Lamjung', province: 'Gandaki' },
    ],
    clientsDetails: {
      fullNameEnglish: 'Kamala Kumari Gurung', fullNameNepali: 'कमला कुमारी गुरुङ',
      membershipId: 'MEM-2080-019', citizenshipNumber: '04-05-01-33344', mobileNumber: '9843456789',
      addresses: [{ addressType: 'P', toleName: 'Bajar', wardNo: '7', municipality: 'Besisahar', district: 'Lamjung', province: 'Gandaki' }]
    },
  },
  {
    id: 'LN-2079-001',
    clientName: 'Bishnu Prasad Adhikari',
    clientNameNepali: 'विष्णु प्रसाद अधिकारी',
    membershipId: 'MEM-2079-007',
    clientId: 5,
    loanAmount: 1000000,
    interestRate: 15,
    interestFormat: 'Annual',
    loanRepaymentType: 'Once at all',
    purposeOfLoan: 'Commercial Property',
    loanIssuedDateBs: '2079-05-01',
    repayDateBs: '2081-05-01',
    loanRemainingToBePaid: 0,
    isTamsukGenerated: true,
    isCompleted: true,
    dhanjamaniDetails: [
      { nameNepali: 'शिव प्रताप अधिकारी', membershipId: 'MEM-2078-009', contactNumber: '9815555555', amountOfDhanjamani: 600000 },
      { nameNepali: 'पार्वती अधिकारी', membershipId: 'MEM-2078-011', contactNumber: '9806666666', amountOfDhanjamani: 400000 },
    ],
    sakshiDetails: [
      { fullNameNepali: 'धर्म प्रसाद', age: 55, gender: 'Male', district: 'Sindhupalchok', province: 'Bagmati' },
    ],
    clientsDetails: {
      fullNameEnglish: 'Bishnu Prasad Adhikari', fullNameNepali: 'विष्णु प्रसाद अधिकारी',
      membershipId: 'MEM-2079-007', citizenshipNumber: '02-01-03-55566', mobileNumber: '9804567890',
      addresses: [{ addressType: 'P', toleName: 'DharaGaun', wardNo: '12', municipality: 'Chautara', district: 'Sindhupalchok', province: 'Bagmati' }]
    },
  },
  {
    id: 'LN-2081-038',
    clientName: 'Manisha Rai',
    clientNameNepali: 'मनिषा राई',
    membershipId: 'MEM-2081-015',
    clientId: 6,
    loanAmount: 150000,
    interestRate: 9.5,
    interestFormat: 'Monthly Reducing',
    loanRepaymentType: 'Quarterly',
    purposeOfLoan: 'Agriculture',
    loanIssuedDateBs: '2081-09-05',
    repayDateBs: '2082-09-05',
    loanRemainingToBePaid: 150000,
    isTamsukGenerated: false,
    isCompleted: false,
    dhanjamaniDetails: [],
    sakshiDetails: [
      { fullNameNepali: 'प्रकाश राई', age: 35, gender: 'Male', district: 'Bhojpur', province: 'Koshi' },
    ],
    clientsDetails: {
      fullNameEnglish: 'Manisha Rai', fullNameNepali: 'मनिषा राई',
      membershipId: 'MEM-2081-015', citizenshipNumber: '07-08-04-77788', mobileNumber: '9875678901',
      addresses: [{ addressType: 'P', toleName: 'Bazar Tole', wardNo: '4', municipality: 'Bhojpur', district: 'Bhojpur', province: 'Koshi' }]
    },
  },
];

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

// ─── Loan Detail Panel ───────────────────────────────────────
const LoanDetail = ({ loan }) => {
  const client = loan.clientsDetails || {};
  const pAddr = client.addresses?.find(a => a.addressType === 'P');
  const addrStr = pAddr
    ? [pAddr.toleName, pAddr.wardNo ? `Ward ${pAddr.wardNo}` : null, pAddr.municipality, pAddr.district, pAddr.province].filter(Boolean).join(', ')
    : null;

  const formatNPR = (n) => `NPR ${Number(n).toLocaleString('en-IN')}`;

  return (
    <div className="history-detail-panel">
      {/* Header */}
      <div className="history-detail-header">
        <div className="history-detail-avatar" style={{ background: 'linear-gradient(135deg, var(--warning-100), var(--warning-200))', color: 'var(--warning-700)' }}>
          💰
        </div>
        <div className="history-detail-title">
          <h3>Loan #{loan.id}</h3>
          <p>{loan.clientNameNepali} · {loan.clientName}</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            {loan.isCompleted
              ? <span className="badge badge-info">✓ Completed</span>
              : <span className="badge badge-warning">● Active</span>
            }
            {loan.isTamsukGenerated
              ? <span className="badge badge-success">Tamsuk Ready</span>
              : <span className="badge badge-danger">Tamsuk Pending</span>
            }
            <code style={{ fontSize: '0.75rem', color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              {loan.membershipId}
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
        <Section icon="📊" title="Loan Information (कर्जा जानकारी)" color="var(--info-500)">
          <Field label="Loan Amount" value={formatNPR(loan.loanAmount)} />
          <Field label="Interest Rate" value={`${loan.interestRate}%`} />
          <Field label="Interest Format" value={loan.interestFormat} />
          <Field label="Repayment Type" value={loan.loanRepaymentType} />
          <Field label="Remaining to Pay" value={formatNPR(loan.loanRemainingToBePaid)} />
          <Field label="Purpose" value={loan.purposeOfLoan} />
          <Field label="Issued Date (BS)" value={loan.loanIssuedDateBs} />
          <Field label="Repayment Date (BS)" value={loan.repayDateBs} />
        </Section>

        <Section icon="👤" title="Principal Borrower (मुख्य ऋणी)" color="var(--primary-500)">
          <Field label="Name (English)" value={client.fullNameEnglish} />
          <Field label="नाम (Nepali)" value={client.fullNameNepali} />
          <Field label="Membership ID" value={client.membershipId} />
          <Field label="Citizenship No" value={client.citizenshipNumber} />
          <Field label="Contact" value={client.mobileNumber} />
          {addrStr && <Field label="Permanent Address" value={addrStr} />}
        </Section>

        {loan.dhanjamaniDetails?.length > 0 && (
          <Section icon="🤝" title="Guarantors (धनजमानी विवरण)" color="var(--warning-500)">
            {loan.dhanjamaniDetails.map((d, i) => (
              <div key={i} style={{ gridColumn: '1 / -1', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.35rem' }}>{d.nameNepali}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                  <span>ID: {d.membershipId}</span>
                  <span>📞 {d.contactNumber}</span>
                  <span>Guaranteed: NPR {Number(d.amountOfDhanjamani).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </Section>
        )}

        {loan.sakshiDetails?.length > 0 && (
          <Section icon="👁️" title="Witnesses (साक्षी विवरण)" color="var(--gray-400)">
            {loan.sakshiDetails.map((s, i) => (
              <div key={i} style={{ gridColumn: '1 / -1', background: 'var(--gray-50)', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.35rem' }}>{s.fullNameNepali}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                  <span>Age: {s.age}</span>
                  <span>Gender: {s.gender}</span>
                  <span>{s.district}, {s.province}</span>
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
const LoanHistoryPage = () => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return MOCK_LOANS;
    const q = query.toLowerCase();
    return MOCK_LOANS.filter(l =>
      l.id?.toLowerCase().includes(q) ||
      l.clientName?.toLowerCase().includes(q) ||
      l.clientNameNepali?.includes(query) ||
      l.membershipId?.toLowerCase().includes(q) ||
      l.purposeOfLoan?.toLowerCase().includes(q) ||
      l.loanRepaymentType?.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="history-layout">
      {/* Left panel */}
      <aside className="history-sidebar">
        <div className="history-sidebar-header">
          <h2>💰 Loan History</h2>
          <p>कर्जा इतिहास</p>
        </div>

        <div className="history-search-wrap">
          <div className="history-search-box">
            <span className="history-search-icon">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search loans..."
              className="history-search-input"
            />
            {query && (
              <button className="history-search-clear" onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          <div className="history-search-hint">
            Loan ID · Client Name · Member ID · Purpose
          </div>
        </div>

        <div className="history-results-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>

        <div className="history-list">
          {filtered.length === 0 ? (
            <div className="history-list-empty">No loans found</div>
          ) : (
            filtered.map(l => (
              <button
                key={l.id}
                className={`history-list-item ${selected?.id === l.id ? 'active' : ''}`}
                onClick={() => setSelected(l)}
              >
                <div className="history-list-avatar" style={{ background: 'linear-gradient(135deg, var(--warning-100), var(--warning-200))', color: 'var(--warning-700)', fontSize: '0.9rem' }}>
                  💰
                </div>
                <div className="history-list-info">
                  <div className="history-list-name">{l.id}</div>
                  <div className="history-list-sub">{l.clientNameNepali}</div>
                  <div className="history-list-sub" style={{ color: 'var(--primary-500)', fontWeight: 600 }}>
                    NPR {Number(l.loanAmount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end', flexShrink: 0 }}>
                  <span className={`badge ${l.isCompleted ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.62rem' }}>
                    {l.isCompleted ? 'Done' : 'Active'}
                  </span>
                  {l.isTamsukGenerated && (
                    <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>PDF</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Right panel */}
      <main className="history-main">
        {selected ? (
          <LoanDetail loan={selected} />
        ) : (
          <div className="history-empty-state">
            <div className="history-empty-icon">💰</div>
            <h3>Select a Loan</h3>
            <p>Search and select a loan record from the left panel to view full details.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LoanHistoryPage;
