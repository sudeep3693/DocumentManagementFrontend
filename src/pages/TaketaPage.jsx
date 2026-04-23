import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import {
  getAnusuchiRelatedApi,
  createAnusuchiRelatedApi,
  updateAnusuchiRelatedApi,
  getTaketaPatraApi,
  createTaketaPatraApi,
  updateTaketaPatraApi,
} from '../services/api';

// ─── Constants ────────────────────────────────────────────────
const TAKETA_TABS = [
  { key: 'taketaPatra1', label: 'Taketa Patra 1', labelNp: 'तमसुक पत्र १', icon: '📄' },
  { key: 'taketaPatra2', label: 'Taketa Patra 2', labelNp: 'तमसुक पत्र २', icon: '📋' },
  { key: 'taketaPatra3', label: 'Taketa Patra 3', labelNp: 'तमसुक पत्र ३', icon: '📑' },
  { key: 'taketaPatra4', label: 'Taketa Patra 4', labelNp: 'तमसुक पत्र ४', icon: '📃' },
];

const EMPTY_ANUSUCHI = {
  anusuchi: '',
  dafa: '',
  year: '',
};

const EMPTY_TAKETA = {
  loanId: '',
  kittaNumber: '',
  remainingLoanAmount: '',
  interestAmount: '',
  loanAmount: '',
  fineAmount: '',
  totalAmount: '',
  reason: '',
  taketa1Id: '',
  taketa2Id: '',
  taketa3Id: '',
};

const PAGE_SIZE = 5;

// ─── Helpers ──────────────────────────────────────────────────
const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  return [];
};

// ─── Sub-components ───────────────────────────────────────────

/** Labelled form field */
const FormField = ({ label, name, value, onChange, type = 'text', placeholder, required, readOnly }) => (
  <div className="form-group">
    <label>{label}{required && ' *'}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      style={readOnly ? { background: 'var(--gray-100)', cursor: 'not-allowed' } : {}}
    />
  </div>
);

/** Section card with accent header */
const SectionCard = ({ icon, title, accentColor = 'var(--primary-500)', children, actions }) => (
  <div style={{
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    marginBottom: '1.25rem',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 1.25rem',
      borderBottom: '1px solid var(--gray-100)',
      borderLeft: `3px solid ${accentColor}`,
      background: 'var(--gray-50)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-800)' }}>{title}</h3>
      </div>
      {actions && <div>{actions}</div>}
    </div>
    <div style={{ padding: '1.25rem' }}>
      {children}
    </div>
  </div>
);

/** Records table with pagination */
const RecordsTable = ({ records }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pageData = records.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (records.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '2rem',
        color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.875rem',
      }}>
        No records yet. Use the form above to create one.
      </div>
    );
  }

  return (
    <>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Loan ID</th>
              <th>Kitta No.</th>
              <th>Loan Amount</th>
              <th>Interest Amount</th>
              <th>Fine Amount</th>
              <th>Total Amount</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((r, i) => (
              <tr key={r.id ?? i}>
                <td>{page * PAGE_SIZE + i + 1}</td>
                <td><code style={{ fontSize: '0.8rem', color: 'var(--primary-600)' }}>{r.loanId ?? '—'}</code></td>
                <td>{r.kittaNumber ?? '—'}</td>
                <td style={{ fontWeight: 600 }}>{r.loanAmount ?? '—'}</td>
                <td>{r.interestAmount ?? '—'}</td>
                <td>{r.fineAmount ?? '—'}</td>
                <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{r.totalAmount ?? '—'}</td>
                <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.reason ?? '—'}
                </td>
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
  );
};

// ─── Taketa Tab Content ────────────────────────────────────────
const TaketaTabContent = ({ taketaType }) => {
  const toast = useToast();

  // Anusuchi state
  const [anusuchiForm, setAnusuchiForm] = useState(EMPTY_ANUSUCHI);
  const [anusuchiId, setAnusuchiId] = useState(null); // null = not yet created
  const [anusuchiLoading, setAnusuchiLoading] = useState(false);
  const [anusuchiSaving, setAnusuchiSaving] = useState(false);

  // Taketa patra state
  const [taketaForm, setTaketaForm] = useState(EMPTY_TAKETA);
  const [taketaId, setTaketaId] = useState(null); // null = not yet created
  const [records, setRecords] = useState([]);
  const [taketaLoading, setTaketaLoading] = useState(false);
  const [taketaSaving, setTaketaSaving] = useState(false);

  // ── Load existing data on tab mount ──
  const loadData = useCallback(async () => {
    setAnusuchiLoading(true);
    setTaketaLoading(true);

    try {
      const anusuchiRes = await getAnusuchiRelatedApi(taketaType);
      const anusuchiData = Array.isArray(anusuchiRes)
        ? anusuchiRes.find(a => a.type === taketaType)
        : (anusuchiRes?.data ?? anusuchiRes);

      if (anusuchiData && anusuchiData.id) {
        setAnusuchiId(anusuchiData.id);
        setAnusuchiForm({
          anusuchi: anusuchiData.anusuchi ?? '',
          dafa: anusuchiData.dafa ?? '',
          year: anusuchiData.year ?? '',
        });
      } else {
        setAnusuchiId(null);
        setAnusuchiForm(EMPTY_ANUSUCHI);
      }
    } catch {
      // No existing anusuchi — fine, will POST on first save
      setAnusuchiId(null);
      setAnusuchiForm(EMPTY_ANUSUCHI);
    } finally {
      setAnusuchiLoading(false);
    }

    try {
      const taketaRes = await getTaketaPatraApi(taketaType);
      const taketaList = extractArray(taketaRes);
      setRecords(taketaList);

      // Pre-populate form with the most recent record for editing
      if (taketaList.length > 0) {
        const latest = taketaList[0];
        setTaketaId(latest.id);
        setTaketaForm({
          loanId: latest.loanId ?? '',
          kittaNumber: latest.kittaNumber ?? '',
          remainingLoanAmount: latest.remainingLoanAmount ?? '',
          interestAmount: latest.interestAmount ?? '',
          loanAmount: latest.loanAmount ?? '',
          fineAmount: latest.fineAmount ?? '',
          totalAmount: latest.totalAmount ?? '',
          reason: latest.reason ?? '',
          taketa1Id: latest.taketa1Id ?? '',
          taketa2Id: latest.taketa2Id ?? '',
          taketa3Id: latest.taketa3Id ?? '',
        });
      } else {
        setTaketaId(null);
        setTaketaForm(EMPTY_TAKETA);
      }
    } catch {
      setRecords([]);
      setTaketaId(null);
      setTaketaForm(EMPTY_TAKETA);
    } finally {
      setTaketaLoading(false);
    }
  }, [taketaType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Anusuchi handlers ──
  const handleAnusuchiChange = (e) => {
    const { name, value } = e.target;
    setAnusuchiForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAnusuchiSubmit = async (e) => {
    e.preventDefault();
    setAnusuchiSaving(true);
    try {
      const payload = {
        ...(anusuchiId ? { id: anusuchiId } : {}),
        type: taketaType,
        anusuchi: anusuchiForm.anusuchi,
        dafa: anusuchiForm.dafa,
        year: anusuchiForm.year,
      };

      if (anusuchiId) {
        await updateAnusuchiRelatedApi(anusuchiId, payload);
        toast.success('अनुसूची अद्यावधिक गरियो। (Anusuchi updated)');
      } else {
        const res = await createAnusuchiRelatedApi(payload);
        const newId = res?.id;
        if (newId) setAnusuchiId(newId);
        toast.success('अनुसूची सिर्जना गरियो। (Anusuchi created)');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save Anusuchi');
    } finally {
      setAnusuchiSaving(false);
    }
  };

  // ── Taketa Patra handlers ──
  const handleTaketaChange = (e) => {
    const { name, value } = e.target;
    setTaketaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTaketaSubmit = async (e) => {
    e.preventDefault();

    if (!anusuchiId) {
      toast.error('Please save the Anusuchi section first before saving Taketa Patra.');
      return;
    }

    setTaketaSaving(true);
    try {
      const payload = {
        loanId: taketaForm.loanId ? Number(taketaForm.loanId) : 0,
        anusuchiRelatedDocumentId: anusuchiId,
        type: taketaType,
        kittaNumber: taketaForm.kittaNumber,
        remainingLoanAmount: taketaForm.remainingLoanAmount,
        interestAmount: taketaForm.interestAmount,
        loanAmount: taketaForm.loanAmount,
        fineAmount: taketaForm.fineAmount,
        totalAmount: taketaForm.totalAmount,
        reason: taketaForm.reason,
        taketa1Id: taketaForm.taketa1Id ? Number(taketaForm.taketa1Id) : 0,
        taketa2Id: taketaForm.taketa2Id ? Number(taketaForm.taketa2Id) : 0,
        taketa3Id: taketaForm.taketa3Id ? Number(taketaForm.taketa3Id) : 0,
      };

      if (taketaId) {
        await updateTaketaPatraApi(taketaId, payload);
        toast.success('तमसुक पत्र अद्यावधिक गरियो। (Taketa Patra updated)');
      } else {
        const res = await createTaketaPatraApi(payload);
        const newId = res?.id;
        if (newId) setTaketaId(newId);
        toast.success('तमसुक पत्र सिर्जना गरियो। (Taketa Patra created)');
      }

      // Refresh records table
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to save Taketa Patra');
    } finally {
      setTaketaSaving(false);
    }
  };

  const handleNewTaketa = () => {
    setTaketaId(null);
    setTaketaForm(EMPTY_TAKETA);
  };

  const isLoading = anusuchiLoading || taketaLoading;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--gray-400)', gap: '0.75rem' }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
        Loading data…
      </div>
    );
  }

  return (
    <div>
      {/* ── Anusuchi Section ── */}
      <SectionCard
        icon="📜"
        title="अनुसूची विवरण (Anusuchi Details)"
        accentColor="var(--warning-500)"
        actions={
          anusuchiId && (
            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>● Saved</span>
          )
        }
      >
        <form onSubmit={handleAnusuchiSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            <FormField
              label="अनुसूची (Anusuchi)"
              name="anusuchi"
              value={anusuchiForm.anusuchi}
              onChange={handleAnusuchiChange}
              placeholder="अनुसूची नम्बर वा विवरण"
              required
            />
            <FormField
              label="दफा (Dafa)"
              name="dafa"
              value={anusuchiForm.dafa}
              onChange={handleAnusuchiChange}
              placeholder="दफा नम्बर"
              required
            />
            <FormField
              label="वर्ष (Year)"
              name="year"
              value={anusuchiForm.year}
              onChange={handleAnusuchiChange}
              placeholder="जस्तै: २०८१"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={anusuchiSaving}>
              <span>{anusuchiId ? '✏️' : '💾'}</span>
              {anusuchiSaving ? 'Saving…' : anusuchiId ? 'Update Anusuchi' : 'Save Anusuchi'}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Taketa Patra Form ── */}
      <SectionCard
        icon="✍️"
        title={taketaId ? 'तमसुक पत्र सम्पादन (Edit Taketa Patra)' : 'नयाँ तमसुक पत्र (New Taketa Patra)'}
        accentColor="var(--primary-500)"
        actions={
          taketaId && (
            <button className="btn btn-sm btn-outline" onClick={handleNewTaketa} style={{ fontSize: '0.75rem' }}>
              + New
            </button>
          )
        }
      >
        {!anusuchiId && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1rem', marginBottom: '1rem',
            background: '#fffbeb', border: '1px solid #fcd34d',
            borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: '#92400e',
          }}>
            <span>⚠️</span>
            <span>Please save the <strong>Anusuchi section</strong> first. The Taketa Patra form requires an Anusuchi ID.</span>
          </div>
        )}
        <form onSubmit={handleTaketaSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            <FormField
              label="Loan ID"
              name="loanId"
              value={taketaForm.loanId}
              onChange={handleTaketaChange}
              placeholder="Loan ID number"
              type="number"
              required
            />
            <FormField
              label="किट्टा नम्बर (Kitta Number)"
              name="kittaNumber"
              value={taketaForm.kittaNumber}
              onChange={handleTaketaChange}
              placeholder="किट्टा नम्बर"
            />
            <FormField
              label="बाँकी ऋण रकम (Remaining Loan Amount)"
              name="remainingLoanAmount"
              value={taketaForm.remainingLoanAmount}
              onChange={handleTaketaChange}
              placeholder="जस्तै: ५,००,०००"
            />
            <FormField
              label="ब्याज रकम (Interest Amount)"
              name="interestAmount"
              value={taketaForm.interestAmount}
              onChange={handleTaketaChange}
              placeholder="जस्तै: ५०,०००"
            />
            <FormField
              label="ऋण रकम (Loan Amount)"
              name="loanAmount"
              value={taketaForm.loanAmount}
              onChange={handleTaketaChange}
              placeholder="जस्तै: ४,५०,०००"
            />
            <FormField
              label="जरिवाना रकम (Fine Amount)"
              name="fineAmount"
              value={taketaForm.fineAmount}
              onChange={handleTaketaChange}
              placeholder="जस्तै: १०,०००"
            />
            <FormField
              label="जम्मा रकम (Total Amount)"
              name="totalAmount"
              value={taketaForm.totalAmount}
              onChange={handleTaketaChange}
              placeholder="जस्तै: ५,१०,०००"
            />
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>कारण (Reason)</label>
              <textarea
                name="reason"
                value={taketaForm.reason}
                onChange={handleTaketaChange}
                placeholder="तमसुक पत्रको कारण उल्लेख गर्नुहोस्…"
                rows={3}
                style={{ resize: 'vertical', width: '100%' }}
              />
            </div>
          </div>

          {/* Optional cross-reference IDs */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--gray-200)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Cross-reference (Optional)
            </p>
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <FormField
                label="Taketa 1 ID"
                name="taketa1Id"
                value={taketaForm.taketa1Id}
                onChange={handleTaketaChange}
                placeholder="ID"
                type="number"
              />
              <FormField
                label="Taketa 2 ID"
                name="taketa2Id"
                value={taketaForm.taketa2Id}
                onChange={handleTaketaChange}
                placeholder="ID"
                type="number"
              />
              <FormField
                label="Taketa 3 ID"
                name="taketa3Id"
                value={taketaForm.taketa3Id}
                onChange={handleTaketaChange}
                placeholder="ID"
                type="number"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={taketaSaving || !anusuchiId}
            >
              <span>{taketaId ? '✏️' : '📄'}</span>
              {taketaSaving ? 'Saving…' : taketaId ? 'Update Taketa Patra' : 'Create Taketa Patra'}
            </button>
            <button type="button" className="btn btn-outline" onClick={handleNewTaketa}>
              Clear
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Records Table ── */}
      <SectionCard
        icon="📋"
        title={`Existing Records (${records.length})`}
        accentColor="var(--info-500)"
      >
        <RecordsTable records={records} />
      </SectionCard>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const TaketaPage = () => {
  const [activeTab, setActiveTab] = useState('taketaPatra1');

  return (
    <div className="taketa-layout">
      {/* Left sidebar */}
      <aside className="taketa-sidebar">
        <div className="taketa-sidebar-header">
          <div className="taketa-sidebar-title">
            <span>📄</span>
            <div>
              <h2>Taketa Patra</h2>
              <p>तमसुक पत्र</p>
            </div>
          </div>
        </div>
        <nav className="taketa-sidebar-nav">
          {TAKETA_TABS.map((t) => (
            <button
              key={t.key}
              className={`taketa-nav-item ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className="taketa-nav-icon">{t.icon}</span>
              <div className="taketa-nav-text">
                <span className="taketa-nav-label">{t.label}</span>
                <span className="taketa-nav-sublabel">{t.labelNp}</span>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="taketa-main">
        <div className="taketa-main-header">
          <h1>
            {TAKETA_TABS.find(t => t.key === activeTab)?.icon}{' '}
            {TAKETA_TABS.find(t => t.key === activeTab)?.label}
          </h1>
          <p className="page-subtitle">
            {TAKETA_TABS.find(t => t.key === activeTab)?.labelNp} — Anusuchi &amp; Taketa Patra management
          </p>
        </div>

        {/* Render a fresh instance per tab so state resets on tab change */}
        {TAKETA_TABS.map(t => (
          activeTab === t.key && (
            <TaketaTabContent key={t.key} taketaType={t.key} />
          )
        ))}
      </main>
    </div>
  );
};

export default TaketaPage;
