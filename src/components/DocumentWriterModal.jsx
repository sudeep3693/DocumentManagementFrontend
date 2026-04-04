import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { createDocumentWriterApi, updateDocumentWriterApi, getCodeValuesApi } from '../services/api';
import { isNepaliAlphaOnly } from '../utils/validation';

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
  GENDER: 1004,
};

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};

// Numeral conversion helpers
const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const nepaliToEnglish = (str) => {
  if (!str && str !== 0) return '';
  return String(str).replace(/[०-९]/g, (ch) => String(NEPALI_DIGITS.indexOf(ch)));
};

const englishToNepali = (str) => {
  if (!str && str !== 0) return '';
  return String(str).replace(/[0-9]/g, (ch) => NEPALI_DIGITS[parseInt(ch)]);
};

const isValidEnglishInteger = (val) => {
  if (!val) return true;
  return /^[0-9]*$/.test(val);
};

const emptyForm = {
  fullNameNepali: '',
  age: '',
  gender: '',
  province: '',
  district: '',
  municipality: '',
  wardNo: '',
  address: ''
};

const DocumentWriterModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [provinces, setProvinces] = useState([]);
  const [districtsObj, setDistrictsObj] = useState({});
  const [municipalitiesObj, setMunicipalitiesObj] = useState({});
  const [wards, setWards] = useState([]);
  const [genders, setGenders] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      fetchInitialDropdowns();
    }
  }, [isOpen, initialData]);

  const fetchInitialDropdowns = async () => {
    setLoading(true);
    try {
      const [prov, w, g] = await Promise.all([
        getCodeValuesApi(CODE_IDS.PROVINCE).catch(() => []),
        getCodeValuesApi(CODE_IDS.WARD).catch(() => []),
        getCodeValuesApi(CODE_IDS.GENDER).catch(() => [])
      ]);
      const fetchedProvinces = extractArray(prov);
      const fetchedWards = extractArray(w);
      const fetchedGenders = extractArray(g);

      setProvinces(fetchedProvinces);
      setWards(fetchedWards);
      setGenders(fetchedGenders);

      if (initialData) {
        let mappedForm = {
          ...initialData,
          age: initialData.age ? nepaliToEnglish(initialData.age) : ''
        };

        if (typeof mappedForm.province === 'string' && isNaN(Number(mappedForm.province))) {
          const pObj = fetchedProvinces.find(x => x.codeValue === mappedForm.province || x.codeValueOptional === mappedForm.province);
          if (pObj) mappedForm.province = pObj.id;
        }

        if (typeof mappedForm.gender === 'string' && isNaN(Number(mappedForm.gender))) {
          const gObj = fetchedGenders.find(x => x.codeValue === mappedForm.gender || x.codeValueOptional === mappedForm.gender);
          if (gObj) mappedForm.gender = gObj.id;
        }

        // Handle string representation that matches a code
        if (typeof mappedForm.wardNo === 'string' && isNaN(Number(mappedForm.wardNo))) {
          const wObj = fetchedWards.find(x => x.codeValue === mappedForm.wardNo || x.codeValueOptional === mappedForm.wardNo);
          if (wObj) mappedForm.wardNo = wObj.id;
        }

        if (mappedForm.province && typeof mappedForm.district === 'string' && isNaN(Number(mappedForm.district))) {
          try {
            const dRes = await getCodeValuesApi(CODE_IDS.DISTRICT, mappedForm.province);
            const dArr = extractArray(dRes);
            setDistrictsObj(prev => ({ ...prev, [mappedForm.province]: dArr }));
            
            const dObj = dArr.find(x => x.codeValue === mappedForm.district || x.codeValueOptional === mappedForm.district);
            if (dObj) mappedForm.district = dObj.id;
            
            if (mappedForm.district && typeof mappedForm.municipality === 'string' && isNaN(Number(mappedForm.municipality))) {
              try {
                const mRes = await getCodeValuesApi(CODE_IDS.MUNICIPALITY, mappedForm.district);
                const mArr = extractArray(mRes);
                setMunicipalitiesObj(prev => ({ ...prev, [mappedForm.district]: mArr }));
                
                const mObj = mArr.find(x => x.codeValue === mappedForm.municipality || x.codeValueOptional === mappedForm.municipality);
                if (mObj) mappedForm.municipality = mObj.id;
              } catch (e) {}
            }
          } catch(e) {}
        }
        
        // Final fallback for missing conversions, ensure number isn't passed if not resolved
        if(isNaN(Number(mappedForm.province))) mappedForm.province = '';
        if(isNaN(Number(mappedForm.district))) mappedForm.district = '';
        if(isNaN(Number(mappedForm.municipality))) mappedForm.municipality = '';
        if(isNaN(Number(mappedForm.gender))) mappedForm.gender = '';
        if(isNaN(Number(mappedForm.wardNo))) mappedForm.wardNo = '';

        setForm(mappedForm);
      } else {
        setForm(emptyForm);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (provinceId) => {
    if (!provinceId || districtsObj[provinceId]) return;
    try {
      const res = await getCodeValuesApi(CODE_IDS.DISTRICT, provinceId);
      setDistrictsObj(prev => ({ ...prev, [provinceId]: extractArray(res) }));
    } catch (e) { }
  };

  const fetchMunicipalities = async (districtId) => {
    if (!districtId || municipalitiesObj[districtId]) return;
    try {
      const res = await getCodeValuesApi(CODE_IDS.MUNICIPALITY, districtId);
      setMunicipalitiesObj(prev => ({ ...prev, [districtId]: extractArray(res) }));
    } catch (e) { }
  };

  useEffect(() => {
    if (form.province) fetchDistricts(form.province);
  }, [form.province]);

  useEffect(() => {
    if (form.district) fetchMunicipalities(form.district);
  }, [form.district]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'age' && !isValidEnglishInteger(value)) return;
    if (name === 'fullNameNepali' && value && !isNepaliAlphaOnly(value)) return;
    
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'province') {
        updated.district = '';
        updated.municipality = '';
      }
      if (name === 'district') {
        updated.municipality = '';
      }
      return updated;
    });
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fullNameNepali) errs.fullNameNepali = 'Required';
    if (!form.age) errs.age = 'Required';
    if (!form.gender) errs.gender = 'Required';
    if (!form.province) errs.province = 'Required';
    if (!form.district) errs.district = 'Required';
    if (!form.municipality) errs.municipality = 'Required';
    if (!form.wardNo) errs.wardNo = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    // Convert necessary data to expected formats
    const payload = {
      fullNameNepali: form.fullNameNepali,
      age: form.age ? englishToNepali(String(form.age)) : '०',
      gender: form.gender ? Number(form.gender) : 0,
      province: form.province ? Number(form.province) : 0,
      district: form.district ? Number(form.district) : 0,
      municipality: form.municipality ? Number(form.municipality) : 0,
      wardNo: form.wardNo ? Number(form.wardNo) : 0,
      address: form.address || ''
    };

    try {
      if (initialData && initialData.id) {
        await updateDocumentWriterApi(initialData.id, payload);
        toast.success('Document Writer updated successfully');
      } else {
        await createDocumentWriterApi(payload);
        toast.success('Document Writer added successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save document writer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>{initialData ? 'Edit Document Writer' : 'Add Document Writer'}</h2>
          <button type="button" className="btn-close" onClick={onClose} disabled={submitting}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.5rem' }}>
            {loading && <p>Loading fields...</p>}
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Full Name (नेपाली नाम) *</label>
                <input name="fullNameNepali" value={form.fullNameNepali} onChange={handleChange} className="form-control" />
                {errors.fullNameNepali && <span className="form-error">{errors.fullNameNepali}</span>}
              </div>
              <div className="form-group">
                <label>Age (उमेर) *</label>
                <input name="age" value={form.age} onChange={handleChange} className="form-control" />
                {errors.age && <span className="form-error">{errors.age}</span>}
              </div>
              <div className="form-group">
                <label>Gender (लिङ्ग) *</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="form-control">
                  <option value="">-- Select --</option>
                  {genders.map(g => <option key={g.id} value={g.id}>{g.codeValueOptional || g.codeValue}</option>)}
                </select>
                {errors.gender && <span className="form-error">{errors.gender}</span>}
              </div>
              <div className="form-group">
                <label>Province (प्रदेश) *</label>
                <select name="province" value={form.province} onChange={handleChange} className="form-control">
                  <option value="">-- Select --</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>)}
                </select>
                {errors.province && <span className="form-error">{errors.province}</span>}
              </div>
              <div className="form-group">
                <label>District (जिल्ला) *</label>
                <select name="district" value={form.district} onChange={handleChange} disabled={!form.province} className="form-control">
                  <option value="">-- Select --</option>
                  {(districtsObj[form.province] || []).map(d => <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>)}
                </select>
                {errors.district && <span className="form-error">{errors.district}</span>}
              </div>
              <div className="form-group">
                <label>Municipality (पालिका) *</label>
                <select name="municipality" value={form.municipality} onChange={handleChange} disabled={!form.district} className="form-control">
                  <option value="">-- Select --</option>
                  {(municipalitiesObj[form.district] || []).map(m => <option key={m.id} value={m.id}>{m.codeValueOptional || m.codeValue}</option>)}
                </select>
                {errors.municipality && <span className="form-error">{errors.municipality}</span>}
              </div>
              <div className="form-group">
                <label>Ward No (वडा) *</label>
                <select name="wardNo" value={form.wardNo} onChange={handleChange} className="form-control">
                  <option value="">-- Select --</option>
                  {wards.map(w => <option key={w.id} value={w.id}>{w.codeValueOptional || w.codeValue}</option>)}
                </select>
                {errors.wardNo && <span className="form-error">{errors.wardNo}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Address (ठेगाना)</label>
                <input name="address" value={form.address} onChange={handleChange} className="form-control" />
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.5rem', textAlign: 'right', padding: '1rem 1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting} style={{ marginRight: '1rem' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
              {submitting ? 'Saving...' : 'Save Document Writer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentWriterModal;
