import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { addClientApi, updateClientApi, getClientByIdApi, getCodeValuesApi } from '../services/api';
import './ClientLayout.css';

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
  ANCESTOR_TYPE: 55,
  SPOUSE_TYPE: 56,
};

const emptyAddress = {
  addressType: 'P',
  province: '',
  district: '',
  municipality: '',
  wardNo: '',
  toleName: '',
  houseNo: '',
};

const emptyForm = {
  accountNumber: '',
  membershipId: '',
  shareAmount: '',
  shareNumber: '',
  fullNameNepali: '',
  fullNameEnglish: '',
  spouseType: '',
  spouseNameNepali: '',
  spouseNameEnglish: '',
  fatherNameEnglish: '',
  fatherNameNepali: '',
  ancestorType: '',
  ancestorNameNepali: '',
  ancestorNameEnglish: '',
  nomineesNameEnglish: '',
  nomineesNameNepali: '',
  nomineesRelation: '',
  guardiansNameEnglish: '',
  guardiansNameNepali: '',
  dateOfBirthBs: '',
  citizenshipNumber: '',
  citizenshipIssueDistrict: '',
  citizenshipIssueDateBs: '',
  emailId: '',
  mobileNumber: '',
  dateOfMembershipBs: '',
  addresses: [{ ...emptyAddress, addressType: 'P' }, { ...emptyAddress, addressType: 'T' }],
};

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};


const ClientFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const isEditing = !!id;

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // General Dropdown options
  const [spouseTypes, setSpouseTypes] = useState([]);
  const [ancestorTypes, setAncestorTypes] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);

  // Address Dropdown options
  const [provinces, setProvinces] = useState([]);
  const [pDistricts, setPDistricts] = useState([]);
  const [tDistricts, setTDistricts] = useState([]);
  const [pMunicipalities, setPMunicipalities] = useState([]);
  const [tMunicipalities, setTMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [prov, wardData, sTypes, aTypes, aDistricts] = await Promise.all([
          getCodeValuesApi(CODE_IDS.PROVINCE),
          getCodeValuesApi(CODE_IDS.WARD),
          getCodeValuesApi(CODE_IDS.SPOUSE_TYPE),
          getCodeValuesApi(CODE_IDS.ANCESTOR_TYPE),
          getCodeValuesApi(CODE_IDS.DISTRICT),
        ]);
        setProvinces(extractArray(prov));
        setWards(extractArray(wardData));
        setSpouseTypes(extractArray(sTypes));
        setAncestorTypes(extractArray(aTypes));
        setAllDistricts(extractArray(aDistricts));
      } catch (err) {
        console.error('Failed to load code values', err);
      }
    };
    fetchSelects();
  }, []);

  useEffect(() => {
    if (isEditing) {
      const fetchClient = async () => {
        try {
          const data = await getClientByIdApi(id);
          let pAddr = { ...emptyAddress, addressType: 'P' };
          let tAddr = { ...emptyAddress, addressType: 'T' };
          
          if (data.addresses && data.addresses.length > 0) {
            const tempP = data.addresses.find(a => a.addressType === 'P');
            const tempT = data.addresses.find(a => a.addressType === 'T');
            if (tempP) pAddr = { ...emptyAddress, ...tempP };
            if (tempT) tAddr = { ...emptyAddress, ...tempT };
          }
          
          setForm({
            ...emptyForm,
            ...data,
            addresses: [pAddr, tAddr]
          });
        } catch (err) {
          toast.error('Failed to load client details');
          navigate('/clients');
        } finally {
          setLoading(false);
        }
      };
      fetchClient();
    }
  }, [id, isEditing, navigate, toast]);

  // Handle cascaded dropdowns for Permanent Address
  useEffect(() => {
    const pProv = form.addresses[0].province;
    if (pProv) {
      getCodeValuesApi(CODE_IDS.DISTRICT, pProv).then(res => setPDistricts(extractArray(res)));
    } else {
      setPDistricts([]);
    }
  }, [form.addresses[0].province]);

  useEffect(() => {
    const pDist = form.addresses[0].district;
    if (pDist) {
      getCodeValuesApi(CODE_IDS.MUNICIPALITY, pDist).then(res => setPMunicipalities(extractArray(res)));
    } else {
      setPMunicipalities([]);
    }
  }, [form.addresses[0].district]);

  // Handle cascaded dropdowns for Temporary Address
  useEffect(() => {
    const tProv = form.addresses[1].province;
    if (tProv) {
      getCodeValuesApi(CODE_IDS.DISTRICT, tProv).then(res => setTDistricts(extractArray(res)));
    } else {
      setTDistricts([]);
    }
  }, [form.addresses[1].province]);

  useEffect(() => {
    const tDist = form.addresses[1].district;
    if (tDist) {
      getCodeValuesApi(CODE_IDS.MUNICIPALITY, tDist).then(res => setTMunicipalities(extractArray(res)));
    } else {
      setTMunicipalities([]);
    }
  }, [form.addresses[1].district]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddressChange = (index, field, value) => {
    setForm(prev => {
      const newAddresses = [...prev.addresses];
      const parsedValue = ['province', 'district', 'municipality', 'wardNo', 'houseNo'].includes(field) ? (value ? Number(value) : '') : value;
      newAddresses[index] = { ...newAddresses[index], [field]: parsedValue };
      if (field === 'province') {
        newAddresses[index].district = '';
        newAddresses[index].municipality = '';
      }
      if (field === 'district') {
        newAddresses[index].municipality = '';
      }
      return { ...prev, addresses: newAddresses };
    });
    
    const errKey = `address_${index}_${field}`;
    if (errors[errKey]) setErrors(prev => ({ ...prev, [errKey]: null }));
  };

  const copyPermanentToTemporary = () => {
    setForm(prev => {
      const pAddr = prev.addresses[0];
      const newAddresses = [...prev.addresses];
      newAddresses[1] = { ...pAddr, addressType: 'T' };
      return { ...prev, addresses: newAddresses };
    });
  };

  const validate = () => {
    const newErrs = {};
    if (!form.accountNumber) newErrs.accountNumber = 'Required';
    if (!form.membershipId) newErrs.membershipId = 'Required';
    if (!form.fullNameNepali) newErrs.fullNameNepali = 'Required';
    if (!form.fullNameEnglish) newErrs.fullNameEnglish = 'Required';
    if (!form.fatherNameEnglish) newErrs.fatherNameEnglish = 'Required';
    if (!form.fatherNameNepali) newErrs.fatherNameNepali = 'Required';
    if (!form.ancestorType) newErrs.ancestorType = 'Required';
    if (!form.ancestorNameNepali) newErrs.ancestorNameNepali = 'Required';
    if (!form.ancestorNameEnglish) newErrs.ancestorNameEnglish = 'Required';
    if (!form.dateOfBirthBs) newErrs.dateOfBirthBs = 'Required';
    if (!form.citizenshipNumber) newErrs.citizenshipNumber = 'Required';
    if (!form.citizenshipIssueDistrict) newErrs.citizenshipIssueDistrict = 'Required';
    if (!form.citizenshipIssueDateBs) newErrs.citizenshipIssueDateBs = 'Required';
    if (!form.dateOfMembershipBs) newErrs.dateOfMembershipBs = 'Required';
    if (!form.mobileNumber) newErrs.mobileNumber = 'Required';

    form.addresses.forEach((addr, i) => {
      if (!addr.province) newErrs[`address_${i}_province`] = 'Required';
      if (!addr.district) newErrs[`address_${i}_district`] = 'Required';
      if (!addr.municipality) newErrs[`address_${i}_municipality`] = 'Required';
      if (!addr.wardNo) newErrs[`address_${i}_wardNo`] = 'Required';
      if (!addr.toleName) newErrs[`address_${i}_toleName`] = 'Required';
    });

    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    const payload = { ...form };
    payload.shareAmount = form.shareAmount ? Number(form.shareAmount) : null;
    payload.shareNumber = form.shareNumber ? Number(form.shareNumber) : null;
    
    // Parse Long fields
    payload.spouseType = form.spouseType ? Number(form.spouseType) : null;
    payload.ancestorType = form.ancestorType ? Number(form.ancestorType) : null;
    payload.nomineesRelation = form.nomineesRelation ? Number(form.nomineesRelation) : null;
    payload.citizenshipIssueDistrict = form.citizenshipIssueDistrict ? Number(form.citizenshipIssueDistrict) : null;

    try {
      if (isEditing) {
        await updateClientApi(id, payload);
        toast.success('Client updated successfully');
      } else {
        await addClientApi(payload);
        toast.success('Client added successfully');
      }
      navigate('/clients');
    } catch (err) {
      toast.error('Failed to save client: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-content">Loading...</div>;

  return (
    <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{isEditing ? 'Edit Client (ग्राहक सम्पादन)' : 'Add Client (नयाँ ग्राहक)'}</h1>
          <p className="page-subtitle">Fill in the client details carefully</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="client-form-container">
        
        {/* General Information */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">General Information (सामान्य जानकारी)</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Account Number *</label>
              <input name="accountNumber" value={form.accountNumber} onChange={handleChange} />
              {errors.accountNumber && <span className="form-error">{errors.accountNumber}</span>}
            </div>
            <div className="form-group">
              <label>Membership ID *</label>
              <input name="membershipId" value={form.membershipId} onChange={handleChange} />
              {errors.membershipId && <span className="form-error">{errors.membershipId}</span>}
            </div>
            <div className="form-group">
              <label>पूरा नाम (Full Name Nepali) *</label>
              <input name="fullNameNepali" value={form.fullNameNepali} onChange={handleChange} />
              {errors.fullNameNepali && <span className="form-error">{errors.fullNameNepali}</span>}
            </div>
            <div className="form-group">
              <label>Full Name (English) *</label>
              <input name="fullNameEnglish" value={form.fullNameEnglish} onChange={handleChange} />
              {errors.fullNameEnglish && <span className="form-error">{errors.fullNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>जन्म मिति / Date of Birth (BS) *</label>
              <input type="date" name="dateOfBirthBs" value={form.dateOfBirthBs} onChange={handleChange} placeholder="YYYY-MM-DD" />
              {errors.dateOfBirthBs && <span className="form-error">{errors.dateOfBirthBs}</span>}
            </div>
            <div className="form-group">
              <label>सदस्यता मिति / Membership Date (BS) *</label>
              <input type="date" name="dateOfMembershipBs" value={form.dateOfMembershipBs} onChange={handleChange} placeholder="YYYY-MM-DD" />
              {errors.dateOfMembershipBs && <span className="form-error">{errors.dateOfMembershipBs}</span>}
            </div>
            <div className="form-group">
              <label>Email ID / ईमेल</label>
              <input type="email" name="emailId" value={form.emailId} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Mobile Number / मोबाइल नम्बर *</label>
              <input name="mobileNumber" value={form.mobileNumber} onChange={handleChange} />
              {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
            </div>
          </div>
        </div>

        {/* Shares Information */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Shares Information (शेयर विवरण)</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Share Amount / शेयर रकम</label>
              <input type="number" name="shareAmount" value={form.shareAmount} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Share Number / शेयर कित्ता</label>
              <input type="number" name="shareNumber" value={form.shareNumber} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Identity Information */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Identity Information (परिचय विवरण)</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Citizenship Number / नागरिकता नम्बर *</label>
              <input name="citizenshipNumber" value={form.citizenshipNumber} onChange={handleChange} />
              {errors.citizenshipNumber && <span className="form-error">{errors.citizenshipNumber}</span>}
            </div>
            <div className="form-group">
              <label>Issue District / जारी जिल्ला *</label>
              <select name="citizenshipIssueDistrict" value={form.citizenshipIssueDistrict} onChange={handleChange}>
                <option value="">-- Select District --</option>
                {allDistricts.map(d => <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>)}
              </select>
              {errors.citizenshipIssueDistrict && <span className="form-error">{errors.citizenshipIssueDistrict}</span>}
            </div>
            <div className="form-group">
              <label>Issue Date / जारी मिति (BS) *</label>
              <input type="date" name="citizenshipIssueDateBs" value={form.citizenshipIssueDateBs} onChange={handleChange} placeholder="YYYY-MM-DD" />
              {errors.citizenshipIssueDateBs && <span className="form-error">{errors.citizenshipIssueDateBs}</span>}
            </div>
          </div>
        </div>

        {/* Family Information */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Family Information (पारिवारिक विवरण)</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>बुबाको नाम (Father Name Nepali) *</label>
              <input name="fatherNameNepali" value={form.fatherNameNepali} onChange={handleChange} />
              {errors.fatherNameNepali && <span className="form-error">{errors.fatherNameNepali}</span>}
            </div>
            <div className="form-group">
              <label>Father Name (English) *</label>
              <input name="fatherNameEnglish" value={form.fatherNameEnglish} onChange={handleChange} />
              {errors.fatherNameEnglish && <span className="form-error">{errors.fatherNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>Spouse Type / पति/पत्नी प्रकार</label>
              <select name="spouseType" value={form.spouseType} onChange={handleChange}>
                <option value="">-- Select --</option>
                {spouseTypes.map(s => <option key={s.id} value={s.id}>{s.codeValueOptional || s.codeValue}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>पति/पत्नीको नाम (Spouse Name Nepali)</label>
              <input name="spouseNameNepali" value={form.spouseNameNepali} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Spouse Name (English)</label>
              <input name="spouseNameEnglish" value={form.spouseNameEnglish} onChange={handleChange} />
            </div>
            <div className="form-group"></div>

            <div className="form-group">
              <label>Ancestor Type / पुर्खा प्रकार *</label>
              <select name="ancestorType" value={form.ancestorType} onChange={handleChange}>
                <option value="">-- Select --</option>
                {ancestorTypes.map(a => <option key={a.id} value={a.id}>{a.codeValueOptional || a.codeValue}</option>)}
              </select>
               {errors.ancestorType && <span className="form-error">{errors.ancestorType}</span>}
            </div>
            <div className="form-group">
              <label>पुर्खाको नाम (Ancestor Name Nepali) *</label>
              <input name="ancestorNameNepali" value={form.ancestorNameNepali} onChange={handleChange} />
              {errors.ancestorNameNepali && <span className="form-error">{errors.ancestorNameNepali}</span>}
            </div>
            <div className="form-group">
              <label>Ancestor Name (English) *</label>
              <input name="ancestorNameEnglish" value={form.ancestorNameEnglish} onChange={handleChange} />
              {errors.ancestorNameEnglish && <span className="form-error">{errors.ancestorNameEnglish}</span>}
            </div>
          </div>
        </div>
        
        {/* Nominee & Guardian */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Nominee & Guardian (हकवाला / संरक्षक)</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>हकवालाको नाम (Nominee Name Nepali)</label>
              <input name="nomineesNameNepali" value={form.nomineesNameNepali} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Nominee Name (English)</label>
              <input name="nomineesNameEnglish" value={form.nomineesNameEnglish} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Nominee Relation (हकवालाको नाता ID)</label>
              <input name="nomineesRelation" value={form.nomineesRelation} onChange={handleChange} placeholder="e.g. 52" />
            </div>
            <div className="form-group">
              <label>संरक्षकको नाम (Guardian Name Nepali)</label>
              <input name="guardiansNameNepali" value={form.guardiansNameNepali} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Guardian Name (English)</label>
              <input name="guardiansNameEnglish" value={form.guardiansNameEnglish} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Permanent Address */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Permanent Address (स्थायी ठेगाना)</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Province / प्रदेश *</label>
              <select value={form.addresses[0].province} onChange={(e) => handleAddressChange(0, 'province', e.target.value)}>
                <option value="">-- Select --</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>)}
              </select>
              {errors.address_0_province && <span className="form-error">{errors.address_0_province}</span>}
            </div>
            <div className="form-group">
              <label>District / जिल्ला *</label>
              <select value={form.addresses[0].district} onChange={(e) => handleAddressChange(0, 'district', e.target.value)} disabled={!form.addresses[0].province}>
                <option value="">-- Select --</option>
                {pDistricts.map(d => <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>)}
              </select>
              {errors.address_0_district && <span className="form-error">{errors.address_0_district}</span>}
            </div>
            <div className="form-group">
              <label>Municipality / पालिका *</label>
              <select value={form.addresses[0].municipality} onChange={(e) => handleAddressChange(0, 'municipality', e.target.value)} disabled={!form.addresses[0].district}>
                <option value="">-- Select --</option>
                {pMunicipalities.map(m => <option key={m.id} value={m.id}>{m.codeValueOptional || m.codeValue}</option>)}
              </select>
              {errors.address_0_municipality && <span className="form-error">{errors.address_0_municipality}</span>}
            </div>
            <div className="form-group">
              <label>Ward No / वडा नं *</label>
              <select value={form.addresses[0].wardNo} onChange={(e) => handleAddressChange(0, 'wardNo', e.target.value)}>
                <option value="">-- Select --</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.codeValueOptional || w.codeValue}</option>)}
              </select>
              {errors.address_0_wardNo && <span className="form-error">{errors.address_0_wardNo}</span>}
            </div>
            <div className="form-group">
              <label>Tole Name / टोल *</label>
              <input value={form.addresses[0].toleName} onChange={(e) => handleAddressChange(0, 'toleName', e.target.value)} />
              {errors.address_0_toleName && <span className="form-error">{errors.address_0_toleName}</span>}
            </div>
            <div className="form-group">
              <label>House No / घर नं</label>
              <input type="number" value={form.addresses[0].houseNo} onChange={(e) => handleAddressChange(0, 'houseNo', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Temporary Address */}
        <div className="form-section-card">
          <div className="form-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="form-section-title">Temporary Address (अस्थायी ठेगाना)</h3>
            <button type="button" className="btn btn-sm btn-outline" onClick={copyPermanentToTemporary}>
              Same as Permanent
            </button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Province / प्रदेश *</label>
              <select value={form.addresses[1].province} onChange={(e) => handleAddressChange(1, 'province', e.target.value)}>
                <option value="">-- Select --</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>)}
              </select>
              {errors.address_1_province && <span className="form-error">{errors.address_1_province}</span>}
            </div>
            <div className="form-group">
              <label>District / जिल्ला *</label>
              <select value={form.addresses[1].district} onChange={(e) => handleAddressChange(1, 'district', e.target.value)} disabled={!form.addresses[1].province}>
                <option value="">-- Select --</option>
                {tDistricts.map(d => <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>)}
              </select>
              {errors.address_1_district && <span className="form-error">{errors.address_1_district}</span>}
            </div>
            <div className="form-group">
              <label>Municipality / पालिका *</label>
              <select value={form.addresses[1].municipality} onChange={(e) => handleAddressChange(1, 'municipality', e.target.value)} disabled={!form.addresses[1].district}>
                <option value="">-- Select --</option>
                {tMunicipalities.map(m => <option key={m.id} value={m.id}>{m.codeValueOptional || m.codeValue}</option>)}
              </select>
              {errors.address_1_municipality && <span className="form-error">{errors.address_1_municipality}</span>}
            </div>
            <div className="form-group">
              <label>Ward No / वडा नं *</label>
              <select value={form.addresses[1].wardNo} onChange={(e) => handleAddressChange(1, 'wardNo', e.target.value)}>
                <option value="">-- Select --</option>
                {wards.map(w => <option key={w.id} value={w.id}>{w.codeValueOptional || w.codeValue}</option>)}
              </select>
              {errors.address_1_wardNo && <span className="form-error">{errors.address_1_wardNo}</span>}
            </div>
            <div className="form-group">
              <label>Tole Name / टोल *</label>
              <input value={form.addresses[1].toleName} onChange={(e) => handleAddressChange(1, 'toleName', e.target.value)} />
              {errors.address_1_toleName && <span className="form-error">{errors.address_1_toleName}</span>}
            </div>
            <div className="form-group">
              <label>House No / घर नं</label>
              <input type="number" value={form.addresses[1].houseNo} onChange={(e) => handleAddressChange(1, 'houseNo', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="form-actions-footer">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/clients')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'Update Client' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientFormPage;
