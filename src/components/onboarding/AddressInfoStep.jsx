import { useState, useEffect } from 'react';
import { getCodeValuesApi } from '../../services/api';

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
};

const AddressInfoStep = ({ prefill, formData, onNext, onBack }) => {
  const [form, setForm] = useState({
    province: '',
    district: '',
    municipality: '',
    tole: '',
    wardNo: '',
    houseNo: '',
  });
  const [errors, setErrors] = useState({});

  // Dropdown options
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [wardNumbers, setWardNumbers] = useState([]);

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Fetch provinces and ward numbers on mount (static lookups)
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await getCodeValuesApi(CODE_IDS.PROVINCE);
        setProvinces(data);
      } catch (err) {
        console.error('Failed to fetch provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    const fetchWards = async () => {
      setLoadingWards(true);
      try {
        const data = await getCodeValuesApi(CODE_IDS.WARD);
        setWardNumbers(data);
      } catch (err) {
        console.error('Failed to fetch ward numbers:', err);
      } finally {
        setLoadingWards(false);
      }
    };
    fetchProvinces();
    fetchWards();
  }, []);

  // Prefill from saved data
  useEffect(() => {
    const source = formData?.address || prefill?.addressInfo;
    if (source) {
      setForm({
        province: source.province || '',
        district: source.district || '',
        municipality: source.municipality || '',
        tole: source.tole || '',
        wardNo: source.wardNo || '',
        houseNo: source.houseNo || '',
      });
    }
  }, [prefill, formData]);

  // Fetch districts when province changes
  useEffect(() => {
    if (!form.province) {
      setDistricts([]);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const data = await getCodeValuesApi(CODE_IDS.DISTRICT, form.province);
        setDistricts(data);
      } catch (err) {
        console.error('Failed to fetch districts:', err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [form.province]);

  // Fetch municipalities when district changes
  useEffect(() => {
    if (!form.district) {
      setMunicipalities([]);
      return;
    }
    const fetchMunicipalities = async () => {
      setLoadingMunicipalities(true);
      try {
        const data = await getCodeValuesApi(CODE_IDS.MUNICIPALITY, form.district);
        setMunicipalities(data);
      } catch (err) {
        console.error('Failed to fetch municipalities:', err);
      } finally {
        setLoadingMunicipalities(false);
      }
    };
    fetchMunicipalities();
  }, [form.district]);



  const validate = () => {
    const errs = {};
    if (!form.province) errs.province = 'Province is required';
    if (!form.district) errs.district = 'District is required';
    if (!form.municipality) errs.municipality = 'Municipality is required';
    if (!form.tole.trim()) errs.tole = 'Tole is required';
    if (!form.wardNo) errs.wardNo = 'Ward number is required';
    if (!form.houseNo.trim()) errs.houseNo = 'House number is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onNext(form);
  };

  const handleProvinceChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, province: value, district: '', municipality: '' });
    setDistricts([]);
    setMunicipalities([]);
    if (errors.province) setErrors({ ...errors, province: '' });
  };

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, district: value, municipality: '' });
    setMunicipalities([]);
    if (errors.district) setErrors({ ...errors, district: '' });
  };

  const handleMunicipalityChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, municipality: value });
    if (errors.municipality) setErrors({ ...errors, municipality: '' });
  };

  const handleWardChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, wardNo: value });
    if (errors.wardNo) setErrors({ ...errors, wardNo: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Address Information</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="province">Province *</label>
          <select id="province" name="province" value={form.province} onChange={handleProvinceChange} disabled={loadingProvinces}>
            <option value="">{loadingProvinces ? 'Loading...' : '-- Select Province --'}</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>
            ))}
          </select>
          {errors.province && <span className="form-error">{errors.province}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="district">District *</label>
          <select id="district" name="district" value={form.district} onChange={handleDistrictChange} disabled={!form.province || loadingDistricts}>
            <option value="">{loadingDistricts ? 'Loading...' : '-- Select District --'}</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>
            ))}
          </select>
          {errors.district && <span className="form-error">{errors.district}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="municipality">Municipality *</label>
          <select id="municipality" name="municipality" value={form.municipality} onChange={handleMunicipalityChange} disabled={!form.district || loadingMunicipalities}>
            <option value="">{loadingMunicipalities ? 'Loading...' : '-- Select Municipality --'}</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>{m.codeValueOptional || m.codeValue}</option>
            ))}
          </select>
          {errors.municipality && <span className="form-error">{errors.municipality}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="tole">Tole *</label>
          <input id="tole" name="tole" value={form.tole} onChange={handleChange} placeholder="e.g. Lamachaur" />
          {errors.tole && <span className="form-error">{errors.tole}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="wardNo">Ward No *</label>
          <select id="wardNo" name="wardNo" value={form.wardNo} onChange={handleWardChange} disabled={loadingWards}>
            <option value="">{loadingWards ? 'Loading...' : '-- Select Ward --'}</option>
            {wardNumbers.map((w) => (
              <option key={w.id} value={w.id}>{w.codeValueOptional || w.codeValue}</option>
            ))}
          </select>
          {errors.wardNo && <span className="form-error">{errors.wardNo}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="houseNo">House No *</label>
          <input id="houseNo" name="houseNo" value={form.houseNo} onChange={handleChange} placeholder="e.g. 123" />
          {errors.houseNo && <span className="form-error">{errors.houseNo}</span>}
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
