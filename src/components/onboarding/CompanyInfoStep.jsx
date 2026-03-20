import { useState, useEffect } from 'react';

const COOPERATIVE_TYPES = [
  { value: 1, label: 'Savings' },
  { value: 2, label: 'Credit' },
  { value: 3, label: 'Multi-purpose' },
  { value: 4, label: 'Agriculture' },
  { value: 5, label: 'Other' },
];

const CompanyInfoStep = ({ data, prefill, formData, onNext }) => {
  const [form, setForm] = useState({
    nameEnglish: '',
    nameNepali: '',
    cooperativeType: '',
    cooperativeRegisteredOffice: '',
    email: '',
    contactNumber: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Priority: formData (user's local edits) > prefill (server data)
    if (formData?.companyInfoRequestDto) {
      const fd = formData.companyInfoRequestDto;
      setForm({
        nameEnglish: fd.nameEnglish || '',
        nameNepali: fd.nameNepali || '',
        cooperativeType: fd.cooperativeType != null ? String(fd.cooperativeType) : '',
        cooperativeRegisteredOffice: fd.cooperativeRegisteredOffice || '',
        email: fd.email || '',
        contactNumber: fd.contactNumber || data?.contactNumber || '',
      });
    } else if (prefill?.cooperativeInfo) {
      const ci = prefill.cooperativeInfo;
      setForm({
        nameEnglish: ci.nameEnglish || '',
        nameNepali: ci.nameNepali || '',
        cooperativeType: ci.cooperativeType != null ? String(ci.cooperativeType) : '',
        cooperativeRegisteredOffice: ci.cooperativeRegisteredOffice || '',
        email: ci.email || '',
        contactNumber: ci.contactNumber || data?.contactNumber || '',
      });
    } else if (data?.contactNumber) {
      setForm((prev) => ({ ...prev, contactNumber: data.contactNumber }));
    }
  }, [prefill, data, formData]);

  const validate = () => {
    const errs = {};
    if (!form.nameEnglish.trim()) errs.nameEnglish = 'Name in English is required';
    else if (form.nameEnglish.length > 100) errs.nameEnglish = 'Max 100 characters';
    if (!form.nameNepali.trim()) errs.nameNepali = 'Name in Nepali is required';
    else if (form.nameNepali.length > 100) errs.nameNepali = 'Max 100 characters';
    if (!form.cooperativeType) errs.cooperativeType = 'Cooperative type is required';
    if (!form.cooperativeRegisteredOffice.trim()) errs.cooperativeRegisteredOffice = 'Registered office is required';
    else if (form.cooperativeRegisteredOffice.length > 150) errs.cooperativeRegisteredOffice = 'Max 150 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    else if (form.contactNumber.length < 6 || form.contactNumber.length > 10) errs.contactNumber = '6-10 digits required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onNext({
      ...form,
      cooperativeType: parseInt(form.cooperativeType, 10),
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Cooperative Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="nameEnglish">Name (English) *</label>
          <input id="nameEnglish" name="nameEnglish" value={form.nameEnglish} onChange={handleChange} placeholder="e.g. Sahas Cooperative" />
          {errors.nameEnglish && <span className="form-error">{errors.nameEnglish}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="nameNepali">Name (Nepali) *</label>
          <input id="nameNepali" name="nameNepali" value={form.nameNepali} onChange={handleChange} placeholder="e.g. सहस सहकारी" />
          {errors.nameNepali && <span className="form-error">{errors.nameNepali}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="cooperativeType">Cooperative Type *</label>
          <select id="cooperativeType" name="cooperativeType" value={form.cooperativeType} onChange={handleChange}>
            <option value="">Select type</option>
            {COOPERATIVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.cooperativeType && <span className="form-error">{errors.cooperativeType}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="cooperativeRegisteredOffice">Registered Office *</label>
          <input id="cooperativeRegisteredOffice" name="cooperativeRegisteredOffice" value={form.cooperativeRegisteredOffice} onChange={handleChange} placeholder="e.g. Pokhara Metropolitan City-19" />
          {errors.cooperativeRegisteredOffice && <span className="form-error">{errors.cooperativeRegisteredOffice}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="demo@email.com" />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number *</label>
          <input id="contactNumber" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="9841234567" maxLength={10} />
          {errors.contactNumber && <span className="form-error">{errors.contactNumber}</span>}
        </div>
      </div>
      <div className="step-actions">
        <div />
        <button type="submit" className="btn btn-primary">Next →</button>
      </div>
    </form>
  );
};

export default CompanyInfoStep;
