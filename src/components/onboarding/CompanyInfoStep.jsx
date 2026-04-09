import { useState, useEffect } from 'react';
import { getCodeValuesApi } from '../../services/api';
import { 
  isValidEnglishName, 
  isNepaliAlphaOnly, 
  isValidEmailChar, 
  hasNoNepali,
  convertToNepaliDigits,
  isEnglishNumber 
} from '../../utils/validation';

const CODE_COOPERATIVE_TYPE = 57;

const CompanyInfoStep = ({ data, prefill, formData, onNext, isEditMode }) => {
  const [form, setForm] = useState({
    nameEnglish: '',
    nameNepali: '',
    cooperativeType: '',
    cooperativeRegisteredOffice: '',
    email: '',
    contactNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [cooperativeTypes, setCooperativeTypes] = useState([]);

  useEffect(() => {
    getCodeValuesApi(CODE_COOPERATIVE_TYPE)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
        setCooperativeTypes(list);

        // Auto-map if cooperativeType is a label instead of an ID
        setForm(prev => {
          if (prev.cooperativeType && isNaN(prev.cooperativeType)) {
            const match = list.find(t => t.codeValueOptional === prev.cooperativeType || t.codeValue === prev.cooperativeType);
            if (match) return { ...prev, cooperativeType: String(match.id) };
          }
          return prev;
        });
      })
      .catch((err) => console.error('Failed to load cooperative types', err));
  }, []);

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
    const payload = {
      cooperativeType: parseInt(form.cooperativeType, 10),
      cooperativeRegisteredOffice: form.cooperativeRegisteredOffice,
      email: form.email,
      contactNumber: form.contactNumber,
    };
    if (!isEditMode) {
      payload.nameEnglish = form.nameEnglish;
      payload.nameNepali = form.nameNepali;
    }
    onNext(payload);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // Real-time filtering based on requirements
    if (name === 'nameEnglish' && !isValidEnglishName(value)) return;
    if (name === 'nameNepali' && !isNepaliAlphaOnly(value)) return;
    if (name === 'cooperativeRegisteredOffice' && !isNepaliAlphaOnly(value)) return;
    if (name === 'email' && (!isValidEmailChar(value) || !hasNoNepali(value))) return;
    if (name === 'contactNumber') {
      if (!isEnglishNumber(value)) return;
      // Removed convertToNepaliDigits as per requirement for Arabic numerals only
    }

    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Cooperative Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="nameEnglish">Name (English) {isEditMode ? '' : '*'}</label>
          <input id="nameEnglish" name="nameEnglish" value={form.nameEnglish} onChange={handleChange} placeholder="e.g. Sahas Cooperative" disabled={isEditMode} />
          {errors.nameEnglish && <span className="form-error">{errors.nameEnglish}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="nameNepali">Name (Nepali) {isEditMode ? '' : '*'}</label>
          <input id="nameNepali" name="nameNepali" value={form.nameNepali} onChange={handleChange} placeholder="e.g. सहस सहकारी" disabled={isEditMode} />
          {errors.nameNepali && <span className="form-error">{errors.nameNepali}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="cooperativeType">Cooperative Type *</label>
          <select id="cooperativeType" name="cooperativeType" value={form.cooperativeType} onChange={handleChange}>
            <option value="">Select type</option>
            {cooperativeTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.codeValueOptional || t.codeValue}</option>
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
