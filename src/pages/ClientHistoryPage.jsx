import { useState, useMemo } from 'react';

// ─── Mock Client Data ────────────────────────────────────────
const MOCK_CLIENTS = [
  {
    id: 1,
    clientId: 'C-2081-001',
    fullNameEnglish: 'Ram Bahadur Thapa',
    fullNameNepali: 'राम बहादुर थापा',
    membershipId: 'MEM-2081-001',
    mobileNumber: '9841234567',
    emailId: 'ram.thapa@example.com',
    gender: 'Male',
    dateOfBirth: { bsDate: '2030-05-12', adDate: '1973-08-27' },
    maritalStatus: 'Married',
    citizenshipNumber: '01-01-01-12345',
    citizenshipIssueDistrict: 'Kathmandu',
    citizenshipIssueDate: { bsDate: '2058-04-10' },
    shareAmount: 50000,
    shareNumber: 5,
    shareCertificateNumber: 'SHR-2081-00123',
    isActive: true,
    fatherNameEnglish: 'Bir Bahadur Thapa',
    fatherNameNepali: 'बिर बहादुर थापा',
    spouseNameEnglish: 'Laxmi Thapa',
    spouseNameNepali: 'लक्ष्मी थापा',
    loanIds: ['LN-2081-001', 'LN-2080-034'],
    addresses: [
      { addressType: 'P', province: 'Bagmati', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan', wardNo: '10', toleName: 'Baluwatar' }
    ],
    dateOfMembership: { bsDate: '2079-01-15' },
  },
  {
    id: 2,
    clientId: 'C-2081-002',
    fullNameEnglish: 'Sita Devi Sharma',
    fullNameNepali: 'सीता देवी शर्मा',
    membershipId: 'MEM-2081-008',
    mobileNumber: '9851098765',
    emailId: 'sita.sharma@example.com',
    gender: 'Female',
    dateOfBirth: { bsDate: '2035-11-22', adDate: '1979-03-05' },
    maritalStatus: 'Married',
    citizenshipNumber: '03-02-05-67890',
    citizenshipIssueDistrict: 'Lalitpur',
    citizenshipIssueDate: { bsDate: '2062-07-18' },
    shareAmount: 30000,
    shareNumber: 3,
    shareCertificateNumber: 'SHR-2081-00456',
    isActive: true,
    fatherNameEnglish: 'Krishna Prasad Mainali',
    fatherNameNepali: 'कृष्ण प्रसाद मैनाली',
    spouseNameEnglish: 'Gopal Sharma',
    spouseNameNepali: 'गोपाल शर्मा',
    loanIds: ['LN-2081-012'],
    addresses: [
      { addressType: 'P', province: 'Bagmati', district: 'Lalitpur', municipality: 'Lalitpur Metropolitan', wardNo: '5', toleName: 'Pulchowk' }
    ],
    dateOfMembership: { bsDate: '2079-06-10' },
  },
  {
    id: 3,
    clientId: 'C-2081-003',
    fullNameEnglish: 'Hari Prasad Poudel',
    fullNameNepali: 'हरि प्रसाद पौडेल',
    membershipId: 'MEM-2080-042',
    mobileNumber: '9862345678',
    emailId: 'hari.poudel@example.com',
    gender: 'Male',
    dateOfBirth: { bsDate: '2025-08-30', adDate: '1969-12-14' },
    maritalStatus: 'Married',
    citizenshipNumber: '05-03-02-11122',
    citizenshipIssueDistrict: 'Kaski',
    citizenshipIssueDate: { bsDate: '2055-10-05' },
    shareAmount: 80000,
    shareNumber: 8,
    shareCertificateNumber: 'SHR-2080-00789',
    isActive: false,
    fatherNameEnglish: 'Dil Prasad Poudel',
    fatherNameNepali: 'दिल प्रसाद पौडेल',
    spouseNameEnglish: 'Mina Poudel',
    spouseNameNepali: 'मिना पौडेल',
    loanIds: ['LN-2080-007', 'LN-2080-019', 'LN-2079-045'],
    addresses: [
      { addressType: 'P', province: 'Gandaki', district: 'Kaski', municipality: 'Pokhara Metropolitan', wardNo: '3', toleName: 'Lakeside' }
    ],
    dateOfMembership: { bsDate: '2078-03-22' },
  },
  {
    id: 4,
    clientId: 'C-2081-004',
    fullNameEnglish: 'Kamala Kumari Gurung',
    fullNameNepali: 'कमला कुमारी गुरुङ',
    membershipId: 'MEM-2080-019',
    mobileNumber: '9843456789',
    emailId: 'kamala.gurung@example.com',
    gender: 'Female',
    dateOfBirth: { bsDate: '2040-02-14', adDate: '1983-05-27' },
    maritalStatus: 'Single',
    citizenshipNumber: '04-05-01-33344',
    citizenshipIssueDistrict: 'Lamjung',
    citizenshipIssueDate: { bsDate: '2068-09-12' },
    shareAmount: 20000,
    shareNumber: 2,
    shareCertificateNumber: 'SHR-2080-01011',
    isActive: true,
    fatherNameEnglish: 'Man Bahadur Gurung',
    fatherNameNepali: 'मान बहादुर गुरुङ',
    spouseNameEnglish: null,
    spouseNameNepali: null,
    loanIds: ['LN-2081-023'],
    addresses: [
      { addressType: 'P', province: 'Gandaki', district: 'Lamjung', municipality: 'Besisahar', wardNo: '7', toleName: 'Bajar' }
    ],
    dateOfMembership: { bsDate: '2078-11-30' },
  },
  {
    id: 5,
    clientId: 'C-2081-005',
    fullNameEnglish: 'Bishnu Prasad Adhikari',
    fullNameNepali: 'विष्णु प्रसाद अधिकारी',
    membershipId: 'MEM-2079-007',
    mobileNumber: '9804567890',
    emailId: 'bishnu.adhikari@example.com',
    gender: 'Male',
    dateOfBirth: { bsDate: '2022-07-19', adDate: '1966-11-03' },
    maritalStatus: 'Married',
    citizenshipNumber: '02-01-03-55566',
    citizenshipIssueDistrict: 'Sindhupalchok',
    citizenshipIssueDate: { bsDate: '2049-06-22' },
    shareAmount: 150000,
    shareNumber: 15,
    shareCertificateNumber: 'SHR-2079-01234',
    isActive: true,
    fatherNameEnglish: 'Ram Prasad Adhikari',
    fatherNameNepali: 'राम प्रसाद अधिकारी',
    spouseNameEnglish: 'Durga Adhikari',
    spouseNameNepali: 'दुर्गा अधिकारी',
    loanIds: ['LN-2079-001', 'LN-2080-062'],
    addresses: [
      { addressType: 'P', province: 'Bagmati', district: 'Sindhupalchok', municipality: 'Chautara', wardNo: '12', toleName: 'DharaGaun' }
    ],
    dateOfMembership: { bsDate: '2077-08-08' },
  },
  {
    id: 6,
    clientId: 'C-2081-006',
    fullNameEnglish: 'Manisha Rai',
    fullNameNepali: 'मनिषा राई',
    membershipId: 'MEM-2081-015',
    mobileNumber: '9875678901',
    emailId: 'manisha.rai@example.com',
    gender: 'Female',
    dateOfBirth: { bsDate: '2045-04-06', adDate: '1988-07-20' },
    maritalStatus: 'Married',
    citizenshipNumber: '07-08-04-77788',
    citizenshipIssueDistrict: 'Bhojpur',
    citizenshipIssueDate: { bsDate: '2072-03-25' },
    shareAmount: 15000,
    shareNumber: 1,
    shareCertificateNumber: 'SHR-2081-01567',
    isActive: true,
    fatherNameEnglish: 'Kumar Rai',
    fatherNameNepali: 'कुमार राई',
    spouseNameEnglish: 'Prakash Rai',
    spouseNameNepali: 'प्रकाश राई',
    loanIds: ['LN-2081-038'],
    addresses: [
      { addressType: 'P', province: 'Koshi', district: 'Bhojpur', municipality: 'Bhojpur', wardNo: '4', toleName: 'Bazar Tole' }
    ],
    dateOfMembership: { bsDate: '2080-02-14' },
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

// ─── Client Detail Panel ─────────────────────────────────────
const ClientDetail = ({ client }) => {
  const pAddr = client.addresses?.find(a => a.addressType === 'P');

  return (
    <div className="history-detail-panel">
      {/* Header */}
      <div className="history-detail-header">
        <div className="history-detail-avatar">
          {client.fullNameEnglish?.charAt(0).toUpperCase()}
        </div>
        <div className="history-detail-title">
          <h3>{client.fullNameNepali}</h3>
          <p>{client.fullNameEnglish}</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
              {client.isActive ? '● Active' : '● Inactive'}
            </span>
            <code style={{ fontSize: '0.75rem', color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              {client.membershipId}
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
        <Section icon="👤" title="Personal Information" color="var(--primary-500)">
          <Field label="Full Name (English)" value={client.fullNameEnglish} />
          <Field label="पूरा नाम (Nepali)" value={client.fullNameNepali} />
          <Field label="Gender" value={client.gender} />
          <Field label="Marital Status" value={client.maritalStatus} />
          <Field label="Date of Birth (BS)" value={client.dateOfBirth?.bsDate} />
          <Field label="Mobile" value={client.mobileNumber} />
          <Field label="Email" value={client.emailId} />
          <Field label="Membership Date (BS)" value={client.dateOfMembership?.bsDate} />
        </Section>

        <Section icon="🪪" title="Identity & Shares" color="var(--info-500)">
          <Field label="Citizenship No" value={client.citizenshipNumber} />
          <Field label="Issue District" value={client.citizenshipIssueDistrict} />
          <Field label="Issue Date (BS)" value={client.citizenshipIssueDate?.bsDate} />
          <Field label="Share Amount" value={client.shareAmount ? `NPR ${client.shareAmount.toLocaleString('en-IN')}` : null} />
          <Field label="Share Number" value={client.shareNumber} />
          <Field label="Certificate No" value={client.shareCertificateNumber} />
        </Section>

        <Section icon="👨‍👩‍👧" title="Family" color="var(--warning-500)">
          <Field label="Father (English)" value={client.fatherNameEnglish} />
          <Field label="बुबाको नाम (Nepali)" value={client.fatherNameNepali} />
          <Field label="Spouse (English)" value={client.spouseNameEnglish} />
          <Field label="पति/पत्नी (Nepali)" value={client.spouseNameNepali} />
        </Section>

        {pAddr && (
          <Section icon="🏠" title="Permanent Address" color="var(--success-500)">
            <Field label="Province" value={pAddr.province} />
            <Field label="District" value={pAddr.district} />
            <Field label="Municipality" value={pAddr.municipality} />
            <Field label="Ward No" value={pAddr.wardNo} />
            <Field label="Tole" value={pAddr.toleName} />
          </Section>
        )}

        {client.loanIds?.length > 0 && (
          <Section icon="💰" title="Associated Loans" color="var(--primary-500)">
            {client.loanIds.map(lid => (
              <Field key={lid} label="Loan ID" value={lid} />
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
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return MOCK_CLIENTS;
    const q = query.toLowerCase();
    return MOCK_CLIENTS.filter(c =>
      c.fullNameEnglish?.toLowerCase().includes(q) ||
      c.fullNameNepali?.includes(query) ||
      c.membershipId?.toLowerCase().includes(q) ||
      c.clientId?.toLowerCase().includes(q) ||
      c.mobileNumber?.includes(q) ||
      c.loanIds?.some(lid => lid.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <div className="history-layout">
      {/* Left panel */}
      <aside className="history-sidebar">
        <div className="history-sidebar-header">
          <h2>🏢 Client History</h2>
          <p>ग्राहक इतिहास</p>
        </div>

        <div className="history-search-wrap">
          <div className="history-search-box">
            <span className="history-search-icon">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, ID, loan..."
              className="history-search-input"
            />
            {query && (
              <button className="history-search-clear" onClick={() => setQuery('')}>✕</button>
            )}
          </div>
          <div className="history-search-hint">
            Name · Nepali Name · Member ID · Client ID · Loan ID
          </div>
        </div>

        <div className="history-results-count">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </div>

        <div className="history-list">
          {filtered.length === 0 ? (
            <div className="history-list-empty">No clients found</div>
          ) : (
            filtered.map(c => (
              <button
                key={c.id}
                className={`history-list-item ${selected?.id === c.id ? 'active' : ''}`}
                onClick={() => setSelected(c)}
              >
                <div className="history-list-avatar">
                  {c.fullNameEnglish?.charAt(0)}
                </div>
                <div className="history-list-info">
                  <div className="history-list-name">{c.fullNameNepali}</div>
                  <div className="history-list-sub">{c.membershipId}</div>
                </div>
                <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Right panel */}
      <main className="history-main">
        {selected ? (
          <ClientDetail client={selected} />
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
