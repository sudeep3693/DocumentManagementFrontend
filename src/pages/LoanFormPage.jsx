import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { searchClientsApi, getCodeValuesApi, addLoanApi, getClientByIdApi, getLoanByIdApi, updateLoanApi } from '../services/api';
import NepaliDatePickerWrapper from '../components/NepaliDatePickerWrapper';
import './ClientLayout.css';

// Strict Nepali numerals validation
const isValidNepaliNumeralWithDotComma = (val) => {
  if (!val) return true;
  return /^[०-९.,]+$/.test(val);
};

const isValidNepaliNumeralComma = (val) => {
  if (!val) return true;
  return /^[०-९,]+$/.test(val);
};

// Simple reusable component to search and select a client
const ClientSearchSelect = ({ label, onSelect, error, selectedClientDisplay }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        setSearching(true);
        searchClientsApi({ query, page: 0, size: 10 })
          .then(res => setResults(res.content || []))
          .catch(() => setResults([]))
          .finally(() => setSearching(false));
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label>{label}</label>
      {selectedClientDisplay ? (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" value={selectedClientDisplay} readOnly className="form-control" />
          <button type="button" className="btn btn-sm btn-outline" onClick={() => onSelect(null)}>Change</button>
        </div>
      ) : (
        <>
          <input
            type="text"
            className="form-control"
            placeholder="Type name or account no. to search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && (query.length >= 2) && (
            <ul style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
              listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto'
            }}>
              {searching ? (
                <li style={{ padding: '0.5rem' }}>Searching...</li>
              ) : results.length > 0 ? (
                results.map(c => (
                  <li
                    key={c.id}
                    style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                    onMouseDown={() => {
                      onSelect(c);
                      setQuery('');
                      setShowDropdown(false);
                    }}
                  >
                    <strong>{c.fullNameNepali || c.fullNameEnglish}</strong> ({c.membershipId || c.accountNumber})
                  </li>
                ))
              ) : (
                <li style={{ padding: '0.5rem' }}>No clients found</li>
              )}
            </ul>
          )}
        </>
      )}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

const emptyDhanjamani = {
  clientId: '',
  amount: '',
  _details: null
};

const emptySakshi = {
  clientId: 0,
  age: '',
  fullNameNepali: '',
  province: '',
  district: '',
  localGovernment: '',
  wardNumber: '',
  gender: '',
  _isExisting: false
};

const emptyForm = {
  clientId: '',
  purposeOfLoan: '',
  interestRate: '',
  loanAmount: '',
  interestRateFormat: '', 
  loanRemainingToBePaid: '',
  repayDateBs: '',
  dhanjamaniList: [{ ...emptyDhanjamani }],
  sakshiList: []
};

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
  GENDER: 1004,
  LOAN_PURPOSE: 3,
  INTEREST_FORMAT: 4
};

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};

const LoanFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditing = !!id;

  const [form, setForm] = useState(emptyForm);
  const [selectedMainClientName, setSelectedMainClientName] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [originalLoan, setOriginalLoan] = useState(null);

  // Dropdowns
  const [provinces, setProvinces] = useState([]);
  const [districtsObj, setDistrictsObj] = useState({});
  const [municipalitiesObj, setMunicipalitiesObj] = useState({});
  const [wards, setWards] = useState([]);
  const [genders, setGenders] = useState([]);
  const [purposes, setPurposes] = useState([{ id: 1, codeValue: 'कृषि (Agriculture)' }, { id: 2, codeValue: 'व्यापार (Business)' }]);
  const [payFormats, setPayFormats] = useState([]);

  useEffect(() => {
    const fetchCodesAndData = async () => {
      try {
        const [prov, w, g, purp, payFmt] = await Promise.all([
          getCodeValuesApi(CODE_IDS.PROVINCE).catch(() => []),
          getCodeValuesApi(CODE_IDS.WARD).catch(() => []),
          getCodeValuesApi(CODE_IDS.GENDER).catch(() => []),
          getCodeValuesApi(CODE_IDS.LOAN_PURPOSE).catch(() => []),
          getCodeValuesApi(CODE_IDS.INTEREST_FORMAT).catch(() => [])
        ]);
        setProvinces(extractArray(prov));
        setWards(extractArray(w));
        setGenders(extractArray(g));

        const fetchedPurposes = extractArray(purp);
        if (fetchedPurposes.length > 0) setPurposes(fetchedPurposes);

        const fetchedPayFormats = extractArray(payFmt);
        setPayFormats(fetchedPayFormats);

        if (isEditing) {
          const loanData = await getLoanByIdApi(id);
          setOriginalLoan(loanData);
          
          const mappedForm = {
            clientId: loanData.clientsDetails?.id || loanData.clientId || '',
            purposeOfLoan: loanData.purposeOfLoan || '', 
            interestRate: loanData.interestRate || '',
            loanAmount: loanData.loanAmount || '',
            interestRateFormat: loanData.interestFormat || loanData.interestRateFormat || 0,
            loanRemainingToBePaid: loanData.loanRemainingToBePaid || '',
            repayDateBs: loanData.repayDate?.bsDate || loanData.repayDateBs || '',
            dhanjamaniList: (loanData.dhanjamaniDetails || []).map(d => ({
              clientId: d.clientId || d.id || '',
              amount: d.amountOfDhanjamani || d.amount || '',
              _details: {
                name: d.nameNepali || '',
                membershipId: d.membershipId || '',
                address: d.temporaryAddressDetails ? `${d.temporaryAddressDetails.toleName || ''}, Ward ${d.temporaryAddressDetails.wardNo || ''}` : ''
              }
            })),
            sakshiList: (loanData.sakshiDetails || []).map(s => ({
              clientId: s.clientId || s.id || s.sakshiId || 0,
              _isExisting: !!(s.clientId || s.id || s.sakshiId),
              age: s.age || '',
              fullNameNepali: s.fullNameNepali || s.fullName || '',
              province: s.province || '',
              district: s.district || '',
              localGovernment: s.localGovernment || '',
              wardNumber: s.wardNumber || '',
              gender: s.gender || ''
            }))
          };

          // If purpose is a string (e.g. "कृषि"), try to find matching ID in the FRESHLY FETCHED PURPOSES
          if (typeof mappedForm.purposeOfLoan === 'string') {
             const found = fetchedPurposes.find(p => p.codeValue === mappedForm.purposeOfLoan || p.codeValueOptional === mappedForm.purposeOfLoan);
             if (found) mappedForm.purposeOfLoan = found.id;
          }

          // If interest format is a string (e.g. "मासिक"), try to find matching ID in the FRESHLY FETCHED PAY FORMATS
          if (typeof mappedForm.interestRateFormat === 'string') {
             const found = fetchedPayFormats.find(p => p.codeValue === mappedForm.interestRateFormat || p.codeValueOptional === mappedForm.interestRateFormat);
             if (found) mappedForm.interestRateFormat = found.id;
          }

          setForm(mappedForm);

          if (loanData.clientsDetails) {
            setSelectedMainClientName(`${loanData.clientsDetails.fullNameNepali || loanData.clientsDetails.fullNameEnglish} (${loanData.clientsDetails.membershipId || loanData.clientsDetails.accountNumber})`);
          } else if (mappedForm.clientId) {
            getClientByIdApi(mappedForm.clientId).then(c => {
               setSelectedMainClientName(`${c.fullNameNepali || c.fullNameEnglish} (${c.membershipId || c.accountNumber})`);
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.error("Failed to fetch codes or loan data", e);
        if (isEditing) toast.error("Failed to load loan details");
      } finally {
        setLoading(false);
      }
    };
    fetchCodesAndData();
  }, [id, isEditing, toast]);

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
    form.sakshiList.forEach(s => {
      if (s.province) fetchDistricts(s.province);
      if (s.district) fetchMunicipalities(s.district);
    });
  }, [form.sakshiList]);

  const handleMainChange = (e, validationType) => {
    const { name, value } = e.target;

    if (validationType === 'dotcomma' && !isValidNepaliNumeralWithDotComma(value)) return;
    if (validationType === 'comma' && !isValidNepaliNumeralComma(value)) return;

    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };

  const handleDhanjamaniChange = (index, field, value) => {
    if (field === 'amount' && !isValidNepaliNumeralWithDotComma(value)) return;
    const newList = [...form.dhanjamaniList];
    newList[index][field] = value;
    setForm(p => ({ ...p, dhanjamaniList: newList }));
  };

  const handleDhanjamaniSelect = async (index, clientObj) => {
    const newList = [...form.dhanjamaniList];
    if (!clientObj) {
      newList[index] = { ...emptyDhanjamani };
    } else {
      newList[index].clientId = clientObj.id;
      try {
        const fullClient = await getClientByIdApi(clientObj.id);
        const pAddr = fullClient.addresses?.find(a => a.addressType === 'P');
        const addrText = pAddr ? `${pAddr.toleName || ''}, Ward ${pAddr.wardNo || ''}` : 'N/A';
        newList[index]._details = {
          name: fullClient.fullNameNepali || fullClient.fullNameEnglish,
          membershipId: fullClient.membershipId || fullClient.accountNumber,
          address: addrText
        };
      } catch (e) {
        newList[index]._details = {
          name: clientObj.fullNameNepali || clientObj.fullNameEnglish,
          membershipId: clientObj.membershipId || clientObj.accountNumber,
          address: 'Address fetch failed'
        };
      }
    }
    setForm(p => ({ ...p, dhanjamaniList: newList }));
  };

  const addDhanjamani = () => {
    setForm(p => ({ ...p, dhanjamaniList: [...p.dhanjamaniList, { ...emptyDhanjamani }] }));
  };

  const removeDhanjamani = (index) => {
    const newList = form.dhanjamaniList.filter((_, i) => i !== index);
    setForm(p => ({ ...p, dhanjamaniList: newList.length ? newList : [{ ...emptyDhanjamani }] }));
  };

  const handleSakshiChange = (index, field, value) => {
    if (field === 'age' && !isValidNepaliNumeralComma(value)) return;

    const newList = [...form.sakshiList];
    newList[index][field] = value;
    if (field === 'province') {
      newList[index].district = '';
      newList[index].localGovernment = '';
    }
    if (field === 'district') {
      newList[index].localGovernment = '';
    }
    setForm(p => ({ ...p, sakshiList: newList }));
  };

  const handleSakshiSelectClient = async (index, clientObj) => {
    const newList = [...form.sakshiList];
    if (!clientObj) {
      newList[index] = { ...emptySakshi, _isExisting: true };
    } else {
      try {
        const fullClient = await getClientByIdApi(clientObj.id);
        const pAddr = fullClient.addresses?.find(a => a.addressType === 'P');
        let ageStr = '';
        if (fullClient.dateOfBirth && fullClient.dateOfBirth.adDate) {
          const dob = new Date(fullClient.dateOfBirth.adDate);
          ageStr = String(new Date().getFullYear() - dob.getFullYear());
        }
        newList[index] = {
          ...newList[index],
          clientId: fullClient.id,
          age: ageStr,
          fullNameNepali: fullClient.fullNameNepali || fullClient.fullNameEnglish,
          gender: fullClient.gender || '',
          province: pAddr?.province || '',
          district: pAddr?.district || '',
          localGovernment: pAddr?.municipality || '',
          wardNumber: pAddr?.wardNo || ''
        };
      } catch (e) {
        toast.error("Failed to load full client details for Sakshi");
      }
    }
    setForm(p => ({ ...p, sakshiList: newList }));
  };

  const addSakshi = (isExisting = false) => {
    setForm(p => ({ ...p, sakshiList: [...p.sakshiList, { ...emptySakshi, _isExisting: isExisting }] }));
  };

  const removeSakshi = (index) => {
    setForm(p => ({ ...p, sakshiList: form.sakshiList.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const newErrs = {};
    if (!form.clientId) newErrs.clientId = 'Please select a main client';
    if (!form.purposeOfLoan) newErrs.purposeOfLoan = 'Required';
    if (!form.interestRate) newErrs.interestRate = 'Required';
    if (!form.loanAmount) newErrs.loanAmount = 'Required';
    if (!form.repayDateBs) newErrs.repayDateBs = 'Required';

    form.dhanjamaniList.forEach((d, i) => {
      // For Edit mode, if clientId isn't available from backend, we might have to bypass or require re-selection.
      if (!isEditing && !d.clientId) newErrs[`dj_${i}_clientId`] = 'Select a guarantor';
      if (!d.amount) newErrs[`dj_${i}_amount`] = 'Amount required';
    });

    form.sakshiList.forEach((s, i) => {
      if (s._isExisting && !s.clientId) newErrs[`sk_${i}_clientId`] = 'Select a witness';
      if (!s._isExisting && !s.fullNameNepali) newErrs[`sk_${i}_fullName`] = 'Name required';
    });

    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaving(true);

    // Setting paid period (pay format) to Long
    const payload = {
      ...form,
      purposeOfLoan: Number(form.purposeOfLoan),
      interestRateFormat: form.interestRateFormat ? Number(form.interestRateFormat) : 0,
      repayDate: { 
        bsDate: typeof form.repayDateBs === 'object' ? form.repayDateBs.bsDate : form.repayDateBs, 
        adDate: typeof form.repayDateBs === 'object' ? form.repayDateBs.adDate : (originalLoan?.repayDateAd || null) 
      },
      dhanjamaniList: form.dhanjamaniList.map(({ _details, ...d }) => ({
        clientId: d.clientId ? Number(d.clientId) : 0,
        amount: String(d.amount)
      })),
      sakshiList: form.sakshiList.map(({ _isExisting, ...s }) => ({
        clientId: s.clientId ? Number(s.clientId) : 0,
        age: String(s.age || '०'),
        fullNameNepali: s.fullNameNepali || '',
        province: s.province ? Number(s.province) : 0,
        district: s.district ? Number(s.district) : 0,
        localGovernment: s.localGovernment ? Number(s.localGovernment) : 0,
        wardNumber: s.wardNumber ? Number(s.wardNumber) : 0,
        gender: s.gender ? Number(s.gender) : 0
      }))
    };

    delete payload.repayDateBs;

    try {
      if (isEditing) {
        await updateLoanApi(id, payload);
        toast.success('Loan updated successfully');
      } else {
        await addLoanApi(payload);
        toast.success('Loan created successfully');
      }
      navigate('/loans');
    } catch (err) {
      toast.error(err.message || 'Failed to save loan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-content">Loading...</div>;

  return (
    <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{isEditing ? 'Edit Loan (कर्जा सम्पादन)' : 'Add New Loan (नयाँ कर्जा)'}</h1>
          <p className="page-subtitle">{isEditing ? 'Update existing loan details' : 'Process a new loan application'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="client-form-container">
        {/* Main Loan Details */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Loan Details (कर्जा विवरण)</h3>
          </div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <ClientSearchSelect
                label="Client (ऋणी) *"
                onSelect={(c) => {
                  if (c) {
                    setForm(p => ({ ...p, clientId: c.id }));
                    setSelectedMainClientName(`${c.fullNameNepali || c.fullNameEnglish} (${c.membershipId || c.accountNumber})`);
                    if (errors.clientId) setErrors(p => ({ ...p, clientId: null }));
                  } else {
                    setForm(p => ({ ...p, clientId: '' }));
                    setSelectedMainClientName('');
                  }
                }}
                error={errors.clientId}
                selectedClientDisplay={selectedMainClientName}
              />
            </div>

            <div className="form-group">
              <label>Purpose of Loan (कर्जाको उद्देश्य) *</label>
              <select name="purposeOfLoan" value={form.purposeOfLoan} onChange={(e) => handleMainChange(e)}>
                <option value="">-- Select --</option>
                {purposes.map(p => <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>)}
              </select>
              {errors.purposeOfLoan && <span className="form-error">{errors.purposeOfLoan}</span>}
            </div>

            <div className="form-group">
              <label>Interest Rate (% ब्याज दर) *</label>
              <input name="interestRate" value={form.interestRate} onChange={(e) => handleMainChange(e, 'dotcomma')} placeholder="e.g. १५.५" />
              {errors.interestRate && <span className="form-error">{errors.interestRate}</span>}
            </div>

            <div className="form-group">
              <label>Loan Amount (कर्जा रकम) *</label>
              <input name="loanAmount" value={form.loanAmount} onChange={(e) => handleMainChange(e, 'dotcomma')} placeholder="e.g. २,५०,०००.५०" />
              {errors.loanAmount && <span className="form-error">{errors.loanAmount}</span>}
            </div>

            <div className="form-group">
              <label>Interest Format (ब्याज दर ढाँचा)</label>
              <select name="interestRateFormat" value={form.interestRateFormat} onChange={(e) => handleMainChange(e)}>
                <option value="">-- Select Format --</option>
                {payFormats.map(p => <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Remaining Amount (बाँकी रकम)</label>
              <input name="loanRemainingToBePaid" value={form.loanRemainingToBePaid} onChange={(e) => handleMainChange(e, 'dotcomma')} placeholder="e.g. १,५०,०००" />
            </div>

            <div className="form-group">
              <label>Repay Date (मिल्ने मिति) (BS) *</label>
              <NepaliDatePickerWrapper name="repayDateBs" value={form.repayDateBs} className="form-control" onChange={(e) => handleMainChange(e)} />
              {errors.repayDateBs && <span className="form-error">{errors.repayDateBs}</span>}
            </div>
          </div>
        </div>

        {/* Dhanjamani Section */}
        <div className="form-section-card">
          <div className="form-section-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="form-section-title">Dhanjamani Details (धनजमानी विवरण) *</h3>
            <button type="button" className="btn btn-sm btn-outline" onClick={addDhanjamani}>+ Add Dhanjamani</button>
          </div>

          {form.dhanjamaniList.map((dj, index) => (
            <div key={index} style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>Guarantor {index + 1}</strong>
                {form.dhanjamaniList.length > 1 && (
                  <button type="button" className="btn btn-sm" style={{ color: 'red' }} onClick={() => removeDhanjamani(index)}>Remove</button>
                )}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <ClientSearchSelect
                    label={isEditing && dj._details && !dj.clientId ? "Client Details (Original ID unavailable, please reselect to fix)" : "Search Existing Client *"}
                    onSelect={(c) => handleDhanjamaniSelect(index, c)}
                    error={errors[`dj_${index}_clientId`]}
                    selectedClientDisplay={dj._details ? `${dj._details.name} ${dj._details.membershipId ? `(Mem: ${dj._details.membershipId})` : ''}` : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Amount (रकम) *</label>
                  <input value={dj.amount} onChange={(e) => handleDhanjamaniChange(index, 'amount', e.target.value)} placeholder="e.g. ५०,०००" />
                  {errors[`dj_${index}_amount`] && <span className="form-error">{errors[`dj_${index}_amount`]}</span>}
                </div>
              </div>
              {dj._details && dj._details.address && (
                <div style={{ background: '#f5f5f5', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  <strong>Address:</strong> {dj._details.address}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sakshi Section */}
        <div className="form-section-card">
          <div className="form-section-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 className="form-section-title">Sakshi Details (साक्षी विवरण)</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => addSakshi(true)}>+ Existing Client</button>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => addSakshi(false)}>+ New Person</button>
            </div>
          </div>

          {form.sakshiList.length === 0 && <p style={{ color: '#666' }}>No Sakshi added. They are optional.</p>}

          {form.sakshiList.map((sk, index) => (
            <div key={index} style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>Witness {index + 1} {sk._isExisting ? '(Existing Client)' : '(New)'}</strong>
                <button type="button" className="btn btn-sm" style={{ color: 'red' }} onClick={() => removeSakshi(index)}>Remove</button>
              </div>

              {sk._isExisting ? (
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <ClientSearchSelect
                      label="Search Client *"
                      onSelect={(c) => handleSakshiSelectClient(index, c)}
                      error={errors[`sk_${index}_clientId`]}
                      selectedClientDisplay={sk.clientId || sk.fullNameNepali ? `${sk.fullNameNepali} (ID: ${sk.clientId})` : ''}
                    />
                  </div>
                  {(sk.clientId !== 0 || sk.fullNameNepali) && (
                    <>
                      <div className="form-group">
                        <label>Auto-filled Name</label>
                        <input readOnly value={sk.fullNameNepali} />
                      </div>
                      <div className="form-group">
                        <label>Age</label>
                        <input readOnly value={sk.age || ''} />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name (नेपाली नाम) *</label>
                    <input value={sk.fullNameNepali} onChange={(e) => handleSakshiChange(index, 'fullNameNepali', e.target.value)} />
                    {errors[`sk_${index}_fullName`] && <span className="form-error">{errors[`sk_${index}_fullName`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>Age (उमेर)</label>
                    <input value={sk.age} onChange={(e) => handleSakshiChange(index, 'age', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Gender (लिङ्ग)</label>
                    <select value={sk.gender} onChange={(e) => handleSakshiChange(index, 'gender', e.target.value)}>
                      <option value="">-- Select --</option>
                      {genders.map(g => <option key={g.id} value={g.id}>{g.codeValueOptional || g.codeValue}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Province (प्रदेश)</label>
                    <select value={sk.province} onChange={(e) => handleSakshiChange(index, 'province', e.target.value)}>
                      <option value="">-- Select --</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>District (जिल्ला)</label>
                    <select value={sk.district} onChange={(e) => handleSakshiChange(index, 'district', e.target.value)} disabled={!sk.province}>
                      <option value="">-- Select --</option>
                      {(districtsObj[sk.province] || []).map(d => <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Municipality (पालिका)</label>
                    <select value={sk.localGovernment} onChange={(e) => handleSakshiChange(index, 'localGovernment', e.target.value)} disabled={!sk.district}>
                      <option value="">-- Select --</option>
                      {(municipalitiesObj[sk.district] || []).map(m => <option key={m.id} value={m.id}>{m.codeValueOptional || m.codeValue}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ward No (वडा)</label>
                    <select value={sk.wardNumber} onChange={(e) => handleSakshiChange(index, 'wardNumber', e.target.value)}>
                      <option value="">-- Select --</option>
                      {wards.map(w => <option key={w.id} value={w.id}>{w.codeValueOptional || w.codeValue}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="form-actions-footer">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/loans')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Processing...' : isEditing ? 'Update Loan' : 'Submit Loan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanFormPage;
