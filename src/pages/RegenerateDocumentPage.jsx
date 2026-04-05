import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getPdfHistoryApi, previewRegeneratePdfApi, confirmRegeneratePdfApi } from '../services/api';
import TableSkeleton from '../components/skeletons/TableSkeleton';
import cache from '../utils/cache';

const RegenerateDocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState({ count: 0, documents: [] });
  const [reason, setReason] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [downloadingUrl, setDownloadingUrl] = useState(null);
  
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const fetchHistory = async (forceRefresh = false) => {
    const cacheKey = `pdfHistory:${id}`;
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        setHistoryData(cached);
        setLoading(false);
        return;
      }
    }
    try {
      setLoading(true);
      const data = await getPdfHistoryApi(id);
      cache.set(cacheKey, data, 300);
      setHistoryData(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch document history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [id]);

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      const data = await previewRegeneratePdfApi(id);
      const htmlString = typeof data === 'string' ? data : data?.htmlContent;
      if (!htmlString) throw new Error('No HTML content returned');
      setPreviewHtml(htmlString);
      toast.success('Preview generated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to generate preview');
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPreview = () => {
    if (!previewHtml) return;
    try {
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
      iframeDoc.write(previewHtml);
      iframeDoc.close();

      iframe.onload = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }
      };
      
      toast.success('Print dialog opened — save as PDF');
    } catch (err) {
      toast.error('Failed to view preview document');
    }
  };

  const handleConfirmRegenerate = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Reason is required to regenerate the document');
      return;
    }
    
    try {
      setRegenerating(true);
      await confirmRegeneratePdfApi(id, { reason });
      toast.success('Document regenerated successfully');
      setReason('');
      setPreviewHtml(null);
      cache.invalidate(`pdfHistory:${id}`);
      await fetchHistory(true);
    } catch (err) {
      toast.error(err.message || 'Failed to confirm document regeneration');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadCloudinaryUrl = async (url) => {
    try {
      setDownloadingUrl(url);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch document HTML');
      const htmlContent = await res.text();

      // We open the HTML in a hidden iframe and trigger the browser's native print dialog
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
          setTimeout(() => {
            document.body.removeChild(iframe);
            setDownloadingUrl(null);
          }, 1000);
        }
      };

      toast.success('Print dialog opened — save as PDF');
    } catch (err) {
      toast.error('Failed to download document');
      setDownloadingUrl(null);
    }
  };

  if (loading) return <TableSkeleton cols={4} rows={3} hasActions={true} />;

  return (
    <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn-sm btn-outline" onClick={() => navigate(`/loans/${id}`)} style={{ marginBottom: '1rem' }}>
            &larr; Back to Loan
          </button>
          <h1>Regenerate Document</h1>
          <p className="page-subtitle">View generation history and regenerate document for Loan #{id}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Document History</h3>
        {historyData.documents && historyData.documents.length === 0 ? (
          <p style={{ color: '#666' }}>No generation history found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>S.N.</th>
                  <th>Reason</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyData.documents.map((doc, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{doc.reason || '—'}</td>
                    <td>{new Date(doc.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleDownloadCloudinaryUrl(doc.documentUrl)}
                        disabled={downloadingUrl === doc.documentUrl}
                      >
                        {downloadingUrl === doc.documentUrl ? 'Downloading...' : 'Download PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Regenerate Document</h3>
        {!previewHtml ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
            <p style={{ color: '#555' }}>Generate a preview of the new document before confirming regeneration.</p>
            <button 
              className="btn btn-primary" 
              onClick={handlePreview} 
              disabled={previewing}
            >
              {previewing ? 'Generating Preview...' : 'Preview Document'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontWeight: '500', color: '#333' }}>Preview generated successfully.</span>
               <button 
                 className="btn btn-secondary" 
                 onClick={handleDownloadPreview}
               >
                 View / Download Preview
               </button>
            </div>
            
            <form onSubmit={handleConfirmRegenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reason for Regeneration <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  className="form-control"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a reason for regenerating the document"
                  required
                  rows="3"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setPreviewHtml(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={regenerating || !reason.trim()}>
                  {regenerating ? 'Confirming...' : 'Confirm Regeneration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegenerateDocumentPage;
