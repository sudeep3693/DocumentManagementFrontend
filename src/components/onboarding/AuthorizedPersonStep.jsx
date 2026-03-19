import { useState, useEffect } from 'react';

const AuthorizedPersonStep = ({ prefill, onNext, onBack }) => {
  const [form, setForm] = useState({
    fullName: '',
    fullNameNepali: '',
    contactNo: '',
    emailAddress: '',
    citizenshipNo: '',
    citizenshipIssuedDistrict: '',
    citizenshipIssuedDate: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (prefill?.authorizedPersonInfo) {
      const p = prefill.authorizedPersonInfo;
      setForm({
        fullName: p.fullName || '',
        fullNameNepali: p.fullNameNepali || '',
        contactNo: p.contactNo || '',
        emailAddress: p.emailAddress || '',
        citizenshipNo: p.citizenshipNo || '',
        citizenshipIssuedDistrict: p.citizenshipIssuedDistrict || '',
        citizenshipIssuedDate: p.citizenshipIssuedDate || '',
      });
    }
  }, [prefill]);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    else if (form.fullName.length > 200) errs.fullName = 'Max 200 characters';
    if (!form.fullNameNepali.trim()) errs.fullNameNepali = 'Name in Nepali is required';
    else if (form.fullNameNepali.length > 200) errs.fullNameNepali = 'Max 200 characters';
    if (!form.contactNo.trim()) errs.contactNo = 'Contact number is required';
    else if (!/^[0-9]{7,10}$/.test(form.contactNo)) errs.contactNo = 'Must be 7-10 digits';
    if (!form.emailAddress.trim()) errs.emailAddress = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress)) errs.emailAddress = 'Invalid email';
    if (!form.citizenshipNo.trim()) errs.citizenshipNo = 'Citizenship number is required';
    else if (form.citizenshipNo.length > 50) errs.citizenshipNo = 'Max 50 characters';
    if (!form.citizenshipIssuedDistrict.trim()) errs.citizenshipIssuedDistrict = 'Issued district is required';
    if (!form.citizenshipIssuedDate) errs.citizenshipIssuedDate = 'Issued date is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onNext(form);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Authorized Person Details</h3>
      <p className="step-desc">Chairperson or Manager details</p>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="fullName">Full Name (English) *</label>
          <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="e.g. Ram Bahadur Thapa" />
          {errors.fullName && <span className="form-error">{errors.fullName}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="fullNameNepali">Full Name (Nepali) *</label>
          <input id="fullNameNepali" name="fullNameNepali" value={form.fullNameNepali} onChange={handleChange} placeholder="e.g. राम बहादुर थापा" />
          {errors.fullNameNepali && <span className="form-error">{errors.fullNameNepali}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="contactNo">Contact Number *</label>
          <input id="contactNo" name="contactNo" value={form.contactNo} onChange={handleChange} placeholder="9841234567" maxLength={10} />
          {errors.contactNo && <span className="form-error">{errors.contactNo}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="emailAddress">Email *</label>
          <input id="emailAddress" name="emailAddress" type="email" value={form.emailAddress} onChange={handleChange} placeholder="ram.thapa@email.com" />
          {errors.emailAddress && <span className="form-error">{errors.emailAddress}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="citizenshipNo">Citizenship No *</label>
          <input id="citizenshipNo" name="citizenshipNo" value={form.citizenshipNo} onChange={handleChange} placeholder="12345/67890" />
          {errors.citizenshipNo && <span className="form-error">{errors.citizenshipNo}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="citizenshipIssuedDistrict">Citizenship Issued District *</label>
          <input id="citizenshipIssuedDistrict" name="citizenshipIssuedDistrict" value={form.citizenshipIssuedDistrict} onChange={handleChange} placeholder="e.g. Kaski" />
          {errors.citizenshipIssuedDistrict && <span className="form-error">{errors.citizenshipIssuedDistrict}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="citizenshipIssuedDate">Citizenship Issued Date *</label>
          <input id="citizenshipIssuedDate" name="citizenshipIssuedDate" type="date" value={form.citizenshipIssuedDate} onChange={handleChange} />
          {errors.citizenshipIssuedDate && <span className="form-error">{errors.citizenshipIssuedDate}</span>}
        </div>
      </div>
      <div className="step-actions">
        <button type="button" className="btn btn-outline" onClick={onBack}>← Back</button>
        <button type="submit" className="btn btn-primary">Next →</button>
      </div>
    </form>
  );
};

export default AuthorizedPersonStep;
