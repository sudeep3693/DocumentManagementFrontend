import { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Priority: formData (user's local edits) > prefill (server data)
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

  const validate = () => {
    const errs = {};
    if (!form.province.trim()) errs.province = 'Province is required';
    if (!form.district.trim()) errs.district = 'District is required';
    if (!form.municipality.trim()) errs.municipality = 'Municipality is required';
    if (!form.tole.trim()) errs.tole = 'Tole is required';
    if (!form.wardNo.trim()) errs.wardNo = 'Ward number is required';
    else if (!/^[0-9]{1,2}$/.test(form.wardNo)) errs.wardNo = 'Must be 1-2 digits';
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
          <input id="province" name="province" value={form.province} onChange={handleChange} placeholder="e.g. Gandaki" />
          {errors.province && <span className="form-error">{errors.province}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="district">District *</label>
          <input id="district" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Kaski" />
          {errors.district && <span className="form-error">{errors.district}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="municipality">Municipality *</label>
          <input id="municipality" name="municipality" value={form.municipality} onChange={handleChange} placeholder="e.g. Pokhara Metropolitan City" />
          {errors.municipality && <span className="form-error">{errors.municipality}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="tole">Tole *</label>
          <input id="tole" name="tole" value={form.tole} onChange={handleChange} placeholder="e.g. Lamachaur" />
          {errors.tole && <span className="form-error">{errors.tole}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="wardNo">Ward No *</label>
          <input id="wardNo" name="wardNo" value={form.wardNo} onChange={handleChange} placeholder="e.g. 19" maxLength={2} />
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
