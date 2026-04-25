import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getLoanByIdApi, downloadTamsukApi, uploadFinalPdfApi } from '../services/api';
import html2pdf from 'html2pdf.js';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';
import cache from '../utils/cache';

/* ─── Reusable detail field ─── */
const Field = ({ label, value, full, highlight }) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
    <div style={{
      fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)',
      textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem',
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '0.9rem', fontWeight: 500,
      color: highlight ? 'var(--primary-700)' : 'var(--gray-800)',
    }}>
      {value || '—'}
    </div>
  </div>
);

/* ─── Section card ─── */
const Section = ({ icon, title, accentColor = 'var(--primary-500)', actions, children }) => (
  <div style={{
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 1.25rem',
      borderBottom: '1px solid var(--gray-100)',
      borderLeft: `3px solid ${accentColor}`,
      background: 'var(--gray-50)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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

const LoanDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingTamsuk, setDownloadingTamsuk] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [uploadingFinal, setUploadingFinal] = useState(false);

  const handleUploadFinal = async () => {
    try {
      setUploadingFinal(true);
      toast.success("Generating and uploading PDF... Please wait.");

      const response = await downloadTamsukApi(loan.id);
      const tempElement = document.createElement('div');
      tempElement.innerHTML = response.htmlContent;

      const opt = {
        margin: 10,
        filename: `tamsuk_${loan.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(tempElement).outputPdf('blob');
      const file = new File([pdfBlob], `tamsuk_${loan.id}.pdf`, { type: 'application/pdf' });

      await uploadFinalPdfApi(file, 'tamsuk', loan.id);
      toast.success('Final PDF saved to backend successfully');
      setHasPreviewed(false);
    } catch (err) {
      toast.error('Failed to generate/save final PDF to backend');
      console.error("PDF Upload Error:", err);
    } finally {
      setUploadingFinal(false);
    }
  };

  useEffect(() => {
    const fetchLoanInfo = async () => {
      const cacheKey = `loans:detail:${id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        setLoan(cached);
        setLoading(false);
        return;
      }
      try {
        const data = await getLoanByIdApi(id);
        cache.set(cacheKey, data, 300);
        setLoan(data);
      } catch (err) {
        toast.error(err.message || 'Failed to fetch loan details');
        navigate('/loans');
      } finally {
        setLoading(false);
      }
    };
    fetchLoanInfo();
  }, [id, navigate, toast]);

  if (loading) return <DetailSkeleton cards={3} itemsPerCard={4} />;
  if (!loan) return <div className="page-content">No loan information found.</div>;

  const handleDownloadTamsuk = async () => {
    try {
      setDownloadingTamsuk(true);
      const response = await downloadTamsukApi(loan.id);
      const { htmlContent, isGenerated } = response;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
            setDownloadingTamsuk(false);
            if (isGenerated) {
              setHasPreviewed(true);
            } else {
              setHasPreviewed(false);
            }
          }, 1000);
        }
      };

      toast.success('Pdf generated');
    } catch (err) {
      toast.error('Failed to download Tamsuk');
      setDownloadingTamsuk(false);
    }
  };

  const client = loan.clientsDetails || {};
  const dList = loan.dhanjamaniDetails || [];
  const sList = loan.sakshiDetails || [];

  const pAddr = (client.addresses || []).find(a => a.addressType === 'P');
  const addrParts = pAddr
    ? [pAddr.toleName, pAddr.wardNo ? `Ward ${pAddr.wardNo}` : null, pAddr.municipality, pAddr.district, pAddr.province].filter(Boolean).join(', ')
    : null;

  return (
    <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* ─── Navigation ─── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn btn-sm btn-outline" onClick={() => navigate('/loans')} style={{ gap: '0.35rem' }}>
          <span>←</span> Back to Loans
        </button>
      </div>

      {/* ─── Loan Header Banner ─── */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
        overflow: 'hidden',
      }}>
        {/* Top accent */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, var(--primary-400), var(--primary-600), var(--primary-500))',
        }} />
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Loan icon */}
            <div style={{
              width: 52, height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', flexShrink: 0,
            }}>
              💰
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                  Loan #{loan.effectiveLoanId || loan.id}
                </h1>
                {loan.isTamsukGenerated ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>● Tamsuk Generated</span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>● Pending Tamsuk</span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: '0.2rem 0 0' }}>
                Client: <strong style={{ color: 'var(--gray-700)' }}>{client.fullNameNepali || loan.clientName || '—'}</strong>
                {client.membershipId && (<> &nbsp;·&nbsp; ID: {client.membershipId}</>)}
              </p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/loans/${loan.id}/edit`)}>
            Edit Loan
          </button>
        </div>
      </div>

      {/* ─── Sections ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Principal Borrower */}
        <Section
          icon="👤"
          title="Principal Borrower (मुख्य ऋणी)"
          accentColor="var(--primary-500)"
          actions={
            client.id && (
              <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clients/${client.id}/edit`)} style={{ fontSize: '0.75rem' }}>
                ✏️ Edit Client
              </button>
            )
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.15rem' }}>
            <Field label="Name (English / Nepali)" value={`${client.fullNameEnglish || '—'} / ${client.fullNameNepali || loan.clientName || '—'}`} />
            <Field label="Membership ID" value={client.membershipId} />
            <Field label="Citizenship / नागरिकता नं" value={client.citizenshipNumber} />
            <Field label="Contact Number" value={client.mobileNumber} />
            {addrParts && <Field label="Permanent Address / स्थायी ठेगाना" value={addrParts} full />}
          </div>
        </Section>

        {/* Loan Info */}
        <Section icon="📊" title="Loan Info (कर्जा जानकारी)" accentColor="var(--info-500)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.15rem' }}>
            <Field label="Loan Amount" value={loan.loanAmount} highlight />
            <Field label="Interest Rate" value={loan.interestRate ? `${loan.interestRate}%` : null} />
            <Field label="Interest Format" value={loan.interestFormat} />
            <Field label="Remaining to be Paid" value={loan.loanRemainingToBePaid} highlight />
            <Field label="Repayment Type" value={loan.loanRepaymentType} />
            <Field label="Purpose" value={loan.purposeOfLoan} />
            <Field label="Issued Date (BS)" value={loan.loanIssuedDateBs} />
            <Field label="Repayment Date (BS)" value={loan.repayDateBs || (loan.repayDate && loan.repayDate.bsDate) || loan.loanRepaymentDateBs} />
          </div>
        </Section>

        {/* Guarantors */}
        <Section icon="🤝" title="Guarantors (धनजमानी विवरण)" accentColor="var(--warning-500)">
          {dList.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.875rem' }}>No guarantors listed.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>S.N.</th>
                    <th>Name</th>
                    <th>Member ID</th>
                    <th>Contact</th>
                    <th>Guaranteed Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dList.map((d, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{d.nameNepali || '—'}</td>
                      <td>{d.membershipId || '—'}</td>
                      <td>{d.contactNumber || '—'}</td>
                      <td>{d.amountOfDhanjamani || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        {d.clientId && (
                          <button className="btn btn-sm btn-outline" onClick={() => navigate(`/clients/${d.clientId}/edit`)} style={{ fontSize: '0.75rem' }}>
                            ✏️ Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Witnesses */}
        <Section icon="👁️" title="Witnesses (साक्षी विवरण)" accentColor="var(--gray-400)">
          {sList.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.875rem' }}>No witnesses listed.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th>S.N.</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {sList.map((s, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{s.fullNameNepali || s.fullName || '—'}</td>
                      <td>{s.age || '—'}</td>
                      <td>{s.gender || '—'}</td>
                      <td>{[s.localGovernment, s.wardNumber ? `Ward ${s.wardNumber}` : null, s.district, s.province].filter(Boolean).join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      {/* ─── Actions Footer ─── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap',
        gap: '0.75rem', marginTop: '1.5rem',
        padding: '1rem 1.25rem',
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <button
          className="btn btn-primary"
          onClick={handleDownloadTamsuk}
          disabled={downloadingTamsuk}
          style={{ gap: '0.4rem' }}
        >
          <span>📄</span>
          {downloadingTamsuk ? 'Downloading...' : 'Download Tamsuk (तमसुक)'}
        </button>
        {loan.isTamsukGenerated && (
          <button
            className="btn btn-outline"
            onClick={() => navigate(`/loans/${loan.id}/regenerate-tamsuk`)}
            style={{ gap: '0.4rem' }}
          >
            <span>🔄</span> Regenerate Document
          </button>
        )}
        {hasPreviewed && (
          <button
            className="btn btn-success"
            onClick={handleUploadFinal}
            disabled={uploadingFinal}
            style={{ gap: '0.4rem' }}
          >
            <span>✅</span>
            {uploadingFinal ? 'Saving Final...' : 'Submit Final Tamsuk'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoanDetailsPage;
