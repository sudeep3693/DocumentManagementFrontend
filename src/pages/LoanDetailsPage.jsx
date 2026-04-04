import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getLoanByIdApi, downloadTamsukApi, uploadFinalPdfApi } from '../services/api';
import html2pdf from 'html2pdf.js';
import LoadingSpinner from '../components/LoadingSpinner';
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

      // Generate the PDF blob via html2pdf
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
      try {
        const data = await getLoanByIdApi(id);
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

  if (loading) return <LoadingSpinner />;
  if (!loan) return <div className="page-content">No loan information found.</div>;

  const handleDownloadTamsuk = async () => {
    try {
      setDownloadingTamsuk(true);
      const response = await downloadTamsukApi(loan.id);
      const { htmlContent, isGenerated } = response;

      // html2canvas (used by html2pdf.js) does NOT support CSS writing-mode / vertical text.
      // We instead open the HTML in a hidden iframe and trigger the browser's native print dialog,
      // which fully honours all CSS including writing-mode: vertical-lr.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';   // A4 width
      iframe.style.height = '297mm';  // A4 height
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for fonts / images inside the iframe to load before printing
      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } finally {
          // Give the print dialog a moment, then clean up the iframe
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

  return (
    <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-sm btn-outline" onClick={() => navigate('/loans')} style={{ marginBottom: '1rem' }}>
            &larr; Back to Loans
          </button>
          <h1>Loan Details (कर्जा विवरण)</h1>
          <p className="page-subtitle">Viewing details for Loan #{loan.id}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate(`/loans/${loan.id}/edit`)}>
          Edit Loan
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Principal Borrower (मुख्य ऋणी)</h3>
          <div className="dropdown-container" style={{ position: 'relative' }}>
            <button
              className="btn btn-sm btn-outline"
              style={{ padding: '2px 8px', fontSize: '1.2rem', lineHeight: 1 }}
              title="Options"
              onClick={(e) => {
                const menu = e.currentTarget.nextElementSibling;
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
              }}
            >
              ⋮
            </button>
            <div
              className="dropdown-menu"
              style={{
                display: 'none',
                position: 'absolute',
                right: 0,
                top: '100%',
                backgroundColor: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '4px',
                zIndex: 10,
                minWidth: '150px'
              }}
            >
              <button
                className="dropdown-item"
                style={{ width: '100%', textAlign: 'left', padding: '10px 15px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => navigate(`/clients/${client.id}/edit`)}
              >
                ✏️ Edit Client (ग्राहक सम्पादन)
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Name (English / Nepali)</strong>
            <span>{client.fullNameEnglish || '—'} / {client.fullNameNepali || loan.clientName || '—'}</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Membership ID</strong>
            <span>{client.membershipId || '—'}</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Citizenship No. / नागरिकता नं</strong>
            <span>{client.citizenshipNumber || '—'}</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Contact Number</strong>
            <span>{client.mobileNumber || '—'}</span>
          </div>
          {(() => {
            const pAddr = (client.addresses || []).find(a => a.addressType === 'P');
            if (!pAddr) return null;
            const parts = [
              pAddr.toleName,
              pAddr.wardNo ? `Ward ${pAddr.wardNo}` : null,
              pAddr.municipality,
              pAddr.district,
              pAddr.province,
            ].filter(Boolean);
            return (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Permanent Address / स्थायी ठेगाना</strong>
                <span>{parts.join(', ') || '—'}</span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Loan Info (कर्जा जानकारी)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Loan Amount</strong>
            <span>{loan.loanAmount || '—'}</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Interest Rate</strong>
            <span>{loan.interestRate ? `${loan.interestRate}%` : '—'}</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Interest Format</strong>
            <span>{loan.interestFormat || '—'}</span>
          </div>
          <div>
            <strong style={{ display: 'block', color: '#666', fontSize: '0.85rem' }}>Repayment Date (BS)</strong>
            <span>{loan.repayDateBs || (loan.repayDate && loan.repayDate.bsDate) || loan.loanRepaymentDateBs || '—'}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Guarantors (धनजमानी विवरण)</h3>
        {dList.length === 0 ? (
          <p style={{ color: '#666' }}>No guarantors listed.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Name</th>
                  <th> Member ID</th>
                  <th>Contact</th>
                  <th>Guaranteed Amnt</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dList.map((d, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{d.nameNepali || '—'}</td>
                    <td>{d.membershipId || '—'}</td>
                    <td>{d.contactNumber || '—'}</td>
                    <td>{d.amountOfDhanjamani || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0 6px', fontSize: '1.2rem', lineHeight: 1 }}
                          onClick={(e) => {
                            const menu = e.currentTarget.nextElementSibling;
                            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                          }}
                        >
                          ⋮
                        </button>
                        <div
                          style={{
                            display: 'none',
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            backgroundColor: '#fff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            borderRadius: '4px',
                            zIndex: 10,
                            minWidth: '130px',
                            textAlign: 'left'
                          }}
                        >
                          <button
                            style={{ width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                            onClick={() => d.clientId && navigate(`/clients/${d.clientId}/edit`)}
                          >
                            ✏️ Edit Client
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Witnesses (साक्षी विवरण)</h3>
        {sList.length === 0 ? (
          <p style={{ color: '#666' }}>No witnesses listed.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                {sList.map((s, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{s.fullNameNepali || s.fullName || '—'}</td>
                    <td>{s.age || '—'}</td>
                    <td>{s.gender || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', gap: '1rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleDownloadTamsuk}
          disabled={downloadingTamsuk}
        >
          {downloadingTamsuk ? 'Downloading...' : 'Download Tamsuk (तमसुक डाउनलोड)'}
        </button>
        {loan.isTamsukGenerated && (
          <button
            className="btn btn-warning"
            onClick={() => navigate(`/loans/${loan.id}/regenerate-tamsuk`)}
          >
            Regenerate Document
          </button>
        )}
        {hasPreviewed && (
          <button
            className="btn btn-success"
            style={{ padding: '0.6rem 1.2rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
            onClick={handleUploadFinal}
            disabled={uploadingFinal}
          >
            {uploadingFinal ? 'Saving Final...' : 'Submit Final Tamsuk'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LoanDetailsPage;
