import { useState } from 'react';

const DOCUMENT_TYPES = [
  { value: 1, label: 'Registration Certificate' },
  { value: 2, label: 'PAN Certificate' },
  { value: 3, label: 'Tax Clearance' },
  { value: 4, label: 'Audit Report' },
  { value: 5, label: 'Other' },
];

const emptyDoc = { documentType: '', documentNumber: '', documentIssueDate: '' };

const DocumentInfoStep = ({ prefill, onNext, onBack }) => {
  const [documents, setDocuments] = useState([{ ...emptyDoc }]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (prefill?.documentInfo && prefill.documentInfo.length > 0) {
      const docs = prefill.documentInfo.map((d) => ({
        documentType: d.documentType !== undefined && d.documentType !== null ? String(d.documentType) : '',
        documentNumber: d.documentNumber || '',
        documentIssueDate: d.documentIssueDate || '',
      }));
      setDocuments(docs);
      setErrors(docs.map(() => ({})));
    }
  }, [prefill]);

  const addDocument = () => {
    setDocuments([...documents, { ...emptyDoc }]);
    setErrors([...errors, {}]);
  };

  const removeDocument = (index) => {
    if (documents.length <= 1) return;
    setDocuments(documents.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    setDocuments(updated);
    if (errors[index]?.[field]) {
      const updatedErrors = [...errors];
      updatedErrors[index] = { ...updatedErrors[index], [field]: '' };
      setErrors(updatedErrors);
    }
  };

  const validate = () => {
    const allErrors = documents.map((doc) => {
      const errs = {};
      if (!doc.documentType) errs.documentType = 'Required';
      if (!doc.documentNumber.trim()) errs.documentNumber = 'Required';
      else if (doc.documentNumber.length > 50) errs.documentNumber = 'Max 50 chars';
      if (!doc.documentIssueDate) errs.documentIssueDate = 'Required';
      return errs;
    });
    return allErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allErrors = validate();
    setErrors(allErrors);
    if (allErrors.some((errs) => Object.keys(errs).length > 0)) return;

    const formattedDocs = documents.map((d) => ({
      documentType: parseInt(d.documentType, 10),
      documentNumber: d.documentNumber.trim(),
      documentIssueDate: d.documentIssueDate,
    }));

    onNext(formattedDocs);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-header">
        <h3>Company Documents</h3>
        <button type="button" className="btn btn-sm btn-outline" onClick={addDocument}>+ Add Document</button>
      </div>

      {documents.map((doc, index) => (
        <div key={index} className="document-row">
          <div className="document-row-header">
            <span className="document-label">Document {index + 1}</span>
            {documents.length > 1 && (
              <button type="button" className="btn-icon-remove" onClick={() => removeDocument(index)}>✕</button>
            )}
          </div>
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label>Type *</label>
              <select value={doc.documentType} onChange={(e) => handleChange(index, 'documentType', e.target.value)}>
                <option value="">Select</option>
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors[index]?.documentType && <span className="form-error">{errors[index].documentType}</span>}
            </div>
            <div className="form-group">
              <label>Document Number *</label>
              <input value={doc.documentNumber} onChange={(e) => handleChange(index, 'documentNumber', e.target.value)} placeholder="DOC123456" />
              {errors[index]?.documentNumber && <span className="form-error">{errors[index].documentNumber}</span>}
            </div>
            <div className="form-group">
              <label>Issue Date *</label>
              <input type="date" value={doc.documentIssueDate} onChange={(e) => handleChange(index, 'documentIssueDate', e.target.value)} />
              {errors[index]?.documentIssueDate && <span className="form-error">{errors[index].documentIssueDate}</span>}
            </div>
          </div>
        </div>
      ))}

      <div className="step-actions">
        <button type="button" className="btn btn-outline" onClick={onBack}>← Back</button>
        <button type="submit" className="btn btn-primary">Next →</button>
      </div>
    </form>
  );
};

export default DocumentInfoStep;
