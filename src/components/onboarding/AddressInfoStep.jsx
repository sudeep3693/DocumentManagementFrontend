import { useState, useEffect } from 'react';
import { getCodeValuesApi } from '../../services/api';

const CODE_PROVINCE = 1001;
const CODE_DISTRICT = 1002;
const CODE_MUNI = 1;
const CODE_WARD = 2;

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};

const AddressInfoStep = ({ prefill, formData, data, onNext, onBack }) => {
  const [address, setAddress] = useState({
    province: '',
    district: '',
    municipality: '',
    wardNo: '',
    tole: '',
    houseNo: '',
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);

  const [errors, setErrors] = useState({});

  // Priority: formData (user's local edits) > prefill (server data) > data (parent component state)
  useEffect(() => {
    let source = formData?.address || prefill?.address || data?.address;

    if (source) {
      setAddress({
        province: source.province != null ? String(source.province) : '',
        district: source.district != null ? String(source.district) : '',
        municipality: source.municipality != null ? String(source.municipality) : '',
        wardNo: source.wardNo != null ? String(source.wardNo) : '',
        tole: source.tole || '',
        houseNo: source.houseNo || '',
      });
    }
  }, [prefill, formData, data]);

  // Default fetch across non-dependent entities
  useEffect(() => {
    getCodeValuesApi(CODE_PROVINCE)
      .then(res => setProvinces(extractArray(res)))
      .catch((err) => console.error('Failed to load provinces', err));

    getCodeValuesApi(CODE_WARD)
      .then(res => setWards(extractArray(res)))
      .catch((err) => console.error('Failed to load wards', err));
  }, []);

  // Fetch cascading logic
  useEffect(() => {
    if (address.province) {
      getCodeValuesApi(CODE_DISTRICT, address.province)
        .then(res => setDistricts(extractArray(res)))
        .catch(err => console.error('Failed to load districts', err));
    } else {
      setDistricts([]);
    }
  }, [address.province]);

  useEffect(() => {
    if (address.district) {
      getCodeValuesApi(CODE_MUNI, address.district)
        .then(res => setMunicipalities(extractArray(res)))
        .catch(err => console.error('Failed to load municipalities', err));
    } else {
      setMunicipalities([]);
    }
  }, [address.district]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => {
      const updated = { ...prev, [name]: value };
      
      // Clear downstream when upstream changes
      if (name === 'province') {
        updated.district = '';
        updated.municipality = '';
      }
      if (name === 'district') {
        updated.municipality = '';
      }
      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!address.province) errs.province = 'Required';
    if (!address.district) errs.district = 'Required';
    if (!address.municipality) errs.municipality = 'Required';
    if (!address.wardNo) errs.wardNo = 'Required';
    if (!address.tole.trim()) errs.tole = 'Required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length > 0) return;

    const payload = {
      province: parseInt(address.province, 10),
      district: parseInt(address.district, 10),
      municipality: parseInt(address.municipality, 10),
      tole: address.tole.trim(),
      wardNo: parseInt(address.wardNo, 10),
      houseNo: address.houseNo.trim() || undefined,
    };

    onNext(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="onboarding-form-area" style={{ border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', background: '#fafbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 600 }}>Company Address</h3>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Province *</label>
            <select name="province" value={address.province} onChange={handleChange}>
              <option value="">Select Province</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>
              ))}
            </select>
            {errors.province && <span className="form-error">{errors.province}</span>}
          </div>

          <div className="form-group">
            <label>District *</label>
            <select name="district" value={address.district} onChange={handleChange} disabled={!address.province}>
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>
              ))}
            </select>
            {errors.district && <span className="form-error">{errors.district}</span>}
          </div>

          <div className="form-group">
            <label>Local Government/Municipality *</label>
            <select name="municipality" value={address.municipality} onChange={handleChange} disabled={!address.district}>
              <option value="">Select Municipality</option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>{m.codeValueOptional || m.codeValue}</option>
              ))}
            </select>
            {errors.municipality && <span className="form-error">{errors.municipality}</span>}
          </div>

          <div className="form-group">
            <label>Ward No *</label>
            <select name="wardNo" value={address.wardNo} onChange={handleChange}>
              <option value="">Select Ward</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.codeValueOptional || w.codeValue}</option>
              ))}
            </select>
            {errors.wardNo && <span className="form-error">{errors.wardNo}</span>}
          </div>

          <div className="form-group">
            <label>Tole Name *</label>
            <input name="tole" value={address.tole} onChange={handleChange} placeholder="e.g. Milan Chowk" />
            {errors.tole && <span className="form-error">{errors.tole}</span>}
          </div>

          <div className="form-group">
            <label>House Number</label>
            <input name="houseNo" value={address.houseNo} onChange={handleChange} placeholder="e.g. 12A" />
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

export default AddressInfoStep;
