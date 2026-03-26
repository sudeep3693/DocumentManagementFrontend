import React, { useState, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { bulkImportClientsApi } from '../services/api';

const BulkImportModal = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isExcel = selectedFile.name.match(/\.(xls|xlsx)$/i);
      if (!isExcel) {
        toast.error('Please select a valid Excel file (.xls or .xlsx)');
        setFile(null);
        e.target.value = null; // reset input
        return;
      }
      setFile(selectedFile);
      setResult(null); // clear previous results on new file select
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResult(null);

    try {
      const responseData = await bulkImportClientsApi(formData);
      setResult(responseData);
      if (responseData.successCount > 0) {
         toast.success(`Successfully imported ${responseData.successCount} clients.`);
      }
      if (responseData.failureCount > 0) {
         toast.error(`Failed to import ${responseData.failureCount} clients.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = null;
    }
    // If there was any success, optionally call onSuccess when closing.
    // Or we can just call it unconditionally so the parent refetches.
    if (result && result.successCount > 0) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Bulk Import Clients</h2>
          <button className="btn-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          {!result ? (
            <div className="upload-section" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
                Please select an Excel file (.xls or .xlsx) containing client data.
              </p>
              <input
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-block', marginBottom: '1rem' }}>
                Browse File
              </label>
              
              {file && (
                <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                  Selected File: <span style={{ color: 'var(--primary-color)' }}>{file.name}</span>
                </div>
              )}

              <div style={{ marginTop: '2rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  style={{ minWidth: '150px' }}
                >
                  {loading ? 'Uploading...' : 'Upload & Import'}
                </button>
              </div>
            </div>
          ) : (
            <div className="result-section">
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-light)', borderRadius: '8px' }}>
                <h3>Import Summary</h3>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                  <div><strong>Total Rows:</strong> {result.totalRows}</div>
                  <div style={{ color: 'var(--success-color)' }}><strong>Success:</strong> {result.successCount}</div>
                  <div style={{ color: 'var(--danger-color)' }}><strong>Failed:</strong> {result.failureCount}</div>
                </div>
              </div>

              {result.failures && result.failures.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Failed Imports</h3>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Row/ID</th>
                          <th>Client Name</th>
                          <th>Error Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.failures.map((f, i) => (
                          <tr key={i}>
                            <td>{f.membershipId || '-'}</td>
                            <td>{f.clientNameEnglish || '-'}</td>
                            <td style={{ color: 'var(--danger-color)' }}>{f.errorMessage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.successes && result.successes.length > 0 && (
                <div>
                  <h3 style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>Successful Imports</h3>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Membership ID</th>
                          <th>Client Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.successes.map((s, i) => (
                          <tr key={i}>
                            <td>{s.membershipId || '-'}</td>
                            <td>{s.clientNameEnglish || '-'}</td>
                            <td style={{ color: 'var(--success-color)' }}>Success</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.5rem', textAlign: 'right' }}>
           <button className="btn btn-outline" onClick={handleClose}>
             {result ? 'Close' : 'Cancel'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
