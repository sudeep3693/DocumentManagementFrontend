import { useState, useEffect } from 'react';
import { getCodeValuesApi } from '../../services/api';
import NepaliDatePickerWrapper from '../NepaliDatePickerWrapper';
import { 
  isValidEnglishName, 
  isNepaliAlphaOnly, 
  isValidNumberWithSymbols,
  convertToNepaliDigits,
  hasNoNepali,
  isEnglishNumber 
} from '../../utils/validation';

const CODE_DISTRICT = 1002;

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};

const AuthorizedPersonStep = ({ prefill, formData, onNext, onBack }) => {
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
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    getCodeValuesApi(CODE_DISTRICT)
      .then(res => {
        const list = extractArray(res);
        setDistricts(list);
        setForm(prev => {
          if (prev.citizenshipIssuedDistrict && isNaN(prev.citizenshipIssuedDistrict)) {
            const match = list.find(d => d.codeValueOptional === prev.citizenshipIssuedDistrict || d.codeValue === prev.citizenshipIssuedDistrict);
            if (match) return { ...prev, citizenshipIssuedDistrict: String(match.id) };
          }
          return prev;
        });
      })
      .catch(err => console.error('Failed to load districts', err));
  }, []);

  useEffect(() => {
    const source = formData?.authorizedPersonRequestDto || prefill?.authorizedPersonInfo;
    if (source) {
      setForm({
        fullName: source.fullName || '',
        fullNameNepali: source.fullNameNepali || '',
        contactNo: source.contactNo || '',
        emailAddress: source.emailAddress || '',
        citizenshipNo: source.citizenshipNo || '',
        citizenshipIssuedDistrict: source.citizenshipIssuedDistrict != null ? String(source.citizenshipIssuedDistrict) : '',
        citizenshipIssuedDate: source.citizenshipIssuedDate || '',
      });
    }
  }, [prefill, formData]);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    else if (form.fullName.length > 200) errs.fullName = 'Max 200 characters';
    if (!form.fullNameNepali.trim()) errs.fullNameNepali = 'Required';
    else if (form.fullNameNepali.length > 200) errs.fullNameNepali = 'Max 200 characters';
    if (!form.contactNo.trim()) errs.contactNo = 'Required';
    else if (!/^[0-9]{7,10}$/.test(form.contactNo)) errs.contactNo = 'Must be 7-10 digits';
    if (!form.emailAddress.trim()) errs.emailAddress = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailAddress)) errs.emailAddress = 'Invalid email';
    if (!form.citizenshipNo.trim()) errs.citizenshipNo = 'Required';
    else if (form.citizenshipNo.length > 50) errs.citizenshipNo = 'Max 50 characters';
    if (!form.citizenshipIssuedDistrict) errs.citizenshipIssuedDistrict = 'Required';
    if (!form.citizenshipIssuedDate) errs.citizenshipIssuedDate = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    const payload = {
      ...form,
      citizenshipNo: convertToNepaliDigits(form.citizenshipNo),
      citizenshipIssuedDistrict: parseInt(form.citizenshipIssuedDistrict, 10),
    };
    onNext(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Real-time filtering
    if (name === 'fullName' && !isValidEnglishName(value)) return;
    if (name === 'fullNameNepali' && !isNepaliAlphaOnly(value)) return;
    if (name === 'contactNo' && !isEnglishNumber(value)) return;
    if (name === 'emailAddress' && !hasNoNepali(value)) return;
    if (name === 'citizenshipNo' && value && !isValidNumberWithSymbols(value)) return;

    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="onboarding-form-area" style={{ border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', background: '#fafbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 600 }}>Authorized Person Details</h3>
        </div>
        
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
            <select id="citizenshipIssuedDistrict" name="citizenshipIssuedDistrict" value={form.citizenshipIssuedDistrict} onChange={handleChange}>
              <option value="">Select District</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>)}
            </select>
            {errors.citizenshipIssuedDistrict && <span className="form-error">{errors.citizenshipIssuedDistrict}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="citizenshipIssuedDate">Citizenship Issued Date *</label>
            <NepaliDatePickerWrapper name="citizenshipIssuedDate" value={form.citizenshipIssuedDate?.bsDate || form.citizenshipIssuedDate || ''} className="form-control" onChange={handleChange} />
            {errors.citizenshipIssuedDate && <span className="form-error">{errors.citizenshipIssuedDate}</span>}
          </div>
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
