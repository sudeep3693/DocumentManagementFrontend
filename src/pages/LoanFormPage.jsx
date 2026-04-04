import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { searchClientsApi, getCodeValuesApi, addLoanApi, getClientByIdApi, getLoanByIdApi, updateLoanApi, getDocumentWriterByIdApi } from '../services/api';
import NepaliDatePickerWrapper from '../components/NepaliDatePickerWrapper';
import DocumentWriterSearchSelect from '../components/DocumentWriterSearchSelect';
import './ClientLayout.css';
import { isNepaliAlphaOnly } from '../utils/validation';

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

// English-only input validators
// Allows digits + optional decimal point (for rate/amount)
const isValidEnglishDecimal = (val) => {
  if (!val) return true;
  return /^[0-9]*\.?[0-9]*$/.test(val);
};

// Allows digits, commas, and one decimal point (currency format)
const isValidEnglishCurrency = (val) => {
  if (!val) return true;
  return /^[0-9,]*\.?[0-9]*$/.test(val);
};

// Allows digits only (whole numbers)
const isValidEnglishInteger = (val) => {
  if (!val) return true;
  return /^[0-9]*$/.test(val);
};

// Simple reusable component to search and select a client
const ClientSearchSelect = ({ label, onSelect, error, selectedClientDisplay, incomplete, incompleteClientId, onEditClient }) => {
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
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={selectedClientDisplay}
              readOnly
              className="form-control"
              style={incomplete ? { border: '2px solid #dc2626', borderRadius: '6px' } : {}}
            />
            <button type="button" className="btn btn-sm btn-outline" onClick={() => onSelect(null)}>Change</button>
          </div>
          {incomplete && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '0.4rem', padding: '0.4rem 0.75rem',
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: '6px', fontSize: '0.85rem', color: '#dc2626'
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>!</span>
              <span>Client details are incomplete. Please complete before creating a loan.</span>
              {incompleteClientId && onEditClient && (
                <button
                  type="button"
                  onClick={() => onEditClient(incompleteClientId)}
                  style={{
                    marginLeft: 'auto', padding: '2px 10px', fontSize: '0.8rem',
                    background: '#dc2626', color: '#fff', border: 'none',
                    borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  ✏️ Edit Client
                </button>
              )}
            </div>
          )}
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
                    {c.completed === false && (
                      <span style={{ marginLeft: '0.5rem', color: '#dc2626', fontSize: '0.8rem', fontWeight: 'bold' }}>⚠ Incomplete</span>
                    )}
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
  loanRepaymentType: '',
  interestRate: '',
  loanAmount: '',
  interestRateFormat: '', 
  loanRemainingToBePaid: '',
  repayDateBs: '',
  dhanjamaniList: [{ ...emptyDhanjamani }],
  sakshiList: [],
  documentWriterId: '',
  documentWriterName: ''
};

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
  GENDER: 1004,
  LOAN_PURPOSE: 3,
  INTEREST_FORMAT: 4,
  LOAN_REPAYMENT_TYPE: 5
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
  const [selectedMainClientIncomplete, setSelectedMainClientIncomplete] = useState(false);
  const [selectedMainClientId, setSelectedMainClientId] = useState(null);
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
  const [repayTypes, setRepayTypes] = useState([]);

  useEffect(() => {
    const fetchCodesAndData = async () => {
      try {
        const [prov, w, g, purp, payFmt, repayTypeRes] = await Promise.all([
          getCodeValuesApi(CODE_IDS.PROVINCE).catch(() => []),
          getCodeValuesApi(CODE_IDS.WARD).catch(() => []),
          getCodeValuesApi(CODE_IDS.GENDER).catch(() => []),
          getCodeValuesApi(CODE_IDS.LOAN_PURPOSE).catch(() => []),
          getCodeValuesApi(CODE_IDS.INTEREST_FORMAT).catch(() => []),
          getCodeValuesApi(CODE_IDS.LOAN_REPAYMENT_TYPE).catch(() => [])
        ]);
        setProvinces(extractArray(prov));
        setWards(extractArray(w));
        setGenders(extractArray(g));

        const fetchedPurposes = extractArray(purp);
        if (fetchedPurposes.length > 0) setPurposes(fetchedPurposes);

        const fetchedPayFormats = extractArray(payFmt);
        setPayFormats(fetchedPayFormats);

        const fetchedRepayTypes = extractArray(repayTypeRes);
        setRepayTypes(fetchedRepayTypes);

        if (isEditing) {
          const loanData = await getLoanByIdApi(id);
          setOriginalLoan(loanData);
          
          let mappedSakshiList = [];
          if (loanData.sakshiDetails) {
            mappedSakshiList = await Promise.all(loanData.sakshiDetails.map(async (s) => {
              let cId = s.clientId || 0;
              let isEx = !!cId;
              let memId = '';
              let fName = s.fullNameNepali || s.fullName || '';
              
              if (isEx) {
                try {
                  const c = await getClientByIdApi(cId);
                  memId = c.membershipId || c.accountNumber || '';
                  fName = c.fullNameNepali || c.fullNameEnglish || fName;
                } catch (e) {}
              }

              let pId = s.province;
              let dId = s.district;
              let mId = s.localGovernment;
              let wId = s.wardNumber;
              let gId = s.gender;

              const fetchedProvinces = extractArray(prov);
              if (typeof pId === 'string' && isNaN(Number(pId))) {
                const pObj = fetchedProvinces.find(x => x.codeValue === pId || x.codeValueOptional === pId);
                if (pObj) pId = pObj.id;
              }

              const fetchedGenders = extractArray(g);
              if (typeof gId === 'string' && isNaN(Number(gId))) {
                const gObj = fetchedGenders.find(x => x.codeValue === gId || x.codeValueOptional === gId);
                if (gObj) gId = gObj.id;
              }

              const wArr = extractArray(w);
              if (typeof wId === 'string' && isNaN(Number(wId))) {
                const wObj = wArr.find(x => x.codeValue === wId || x.codeValueOptional === wId);
                if (wObj) wId = wObj.id;
              }

              if (pId && typeof dId === 'string' && isNaN(Number(dId))) {
                try {
                  const dRes = await getCodeValuesApi(CODE_IDS.DISTRICT, pId);
                  const dArr = extractArray(dRes);
                  setDistrictsObj(prev => ({ ...prev, [pId]: dArr }));
                  const dObj = dArr.find(x => x.codeValue === dId || x.codeValueOptional === dId);
                  if (dObj) dId = dObj.id;
                } catch (e) {}
              }

              if (dId && typeof mId === 'string' && isNaN(Number(mId))) {
                try {
                  const mRes = await getCodeValuesApi(CODE_IDS.MUNICIPALITY, dId);
                  const mArr = extractArray(mRes);
                  setMunicipalitiesObj(prev => ({ ...prev, [dId]: mArr }));
                  const mObj = mArr.find(x => x.codeValue === mId || x.codeValueOptional === mId);
                  if (mObj) mId = mObj.id;
                } catch (e) {}
              }

              return {
                clientId: cId,
                membershipId: memId,
                _isExisting: isEx,
                age: s.age || '',
                fullNameNepali: fName,
                province: pId || '',
                district: dId || '',
                localGovernment: mId || '',
                wardNumber: wId || '',
                gender: gId || ''
              };
            }));
          }

          const mappedForm = {
            clientId: loanData.clientsDetails?.id || loanData.clientId || '',
            purposeOfLoan: loanData.purposeOfLoan || '', 
            loanRepaymentType: loanData.loanRepaymentType || '',
            interestRate: nepaliToEnglish(loanData.interestRate),
            loanAmount: nepaliToEnglish(loanData.loanAmount),
            interestRateFormat: loanData.interestFormat || loanData.interestRateFormat || 0,
            loanRemainingToBePaid: nepaliToEnglish(loanData.loanRemainingToBePaid),
            repayDateBs: loanData.repayDate?.bsDate || loanData.repayDateBs || '',
            dhanjamaniList: (loanData.dhanjamaniDetails || []).map(d => ({
              clientId: d.clientId || d.id || '',
              amount: nepaliToEnglish(d.amountOfDhanjamani || d.amount),
              _details: {
                name: d.nameNepali || '',
                membershipId: d.membershipId || '',
                address: d.temporaryAddressDetails ? `${d.temporaryAddressDetails.toleName || ''}, Ward ${d.temporaryAddressDetails.wardNo || ''}` : ''
              }
            })),
            sakshiList: mappedSakshiList,
            documentWriterId: '',
            documentWriterName: ''
          };

          if (loanData.documentWriterId) {
            try {
              const dw = await getDocumentWriterByIdApi(loanData.documentWriterId);
              mappedForm.documentWriterId = dw.id;
              mappedForm.documentWriterName = dw.fullNameNepali || '';
            } catch (err) {
              console.error("Failed to fetch document writer details", err);
            }
          }

          // If purpose is a string (e.g. "कृषि"), try to find matching ID in the FRESHLY FETCHED PURPOSES
          if (typeof mappedForm.purposeOfLoan === 'string') {
             const found = fetchedPurposes.find(p => p.codeValue === mappedForm.purposeOfLoan || p.codeValueOptional === mappedForm.purposeOfLoan);
             if (found) mappedForm.purposeOfLoan = found.id;
          }

          // If loan repayment type is a string, map it to ID
          if (typeof mappedForm.loanRepaymentType === 'string' && mappedForm.loanRepaymentType) {
             const found = fetchedRepayTypes.find(p => p.codeValue === mappedForm.loanRepaymentType || p.codeValueOptional === mappedForm.loanRepaymentType);
             if (found) mappedForm.loanRepaymentType = found.id;
          }

          // If interest format is a string (e.g. "मासिक"), try to find matching ID in the FRESHLY FETCHED PAY FORMATS
          if (typeof mappedForm.interestRateFormat === 'string') {
             const found = fetchedPayFormats.find(p => p.codeValue === mappedForm.interestRateFormat || p.codeValueOptional === mappedForm.interestRateFormat);
             if (found) mappedForm.interestRateFormat = found.id;
          }

          setForm(mappedForm);

          if (loanData.clientsDetails) {
            const cd = loanData.clientsDetails;
            setSelectedMainClientName(`${cd.fullNameNepali || cd.fullNameEnglish} (${cd.membershipId || cd.accountNumber})`);
            setSelectedMainClientIncomplete(cd.completed === false);
            setSelectedMainClientId(cd.id);
          } else if (mappedForm.clientId) {
            getClientByIdApi(mappedForm.clientId).then(c => {
               setSelectedMainClientName(`${c.fullNameNepali || c.fullNameEnglish} (${c.membershipId || c.accountNumber})`);
               setSelectedMainClientIncomplete(c.completed === false);
               setSelectedMainClientId(c.id);
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

    if (validationType === 'currency' && !isValidEnglishCurrency(value)) return;
    if (validationType === 'decimal' && !isValidEnglishDecimal(value)) return;
    if (validationType === 'integer' && !isValidEnglishInteger(value)) return;

    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };

  const handleDhanjamaniChange = (index, field, value) => {
    if (field === 'amount' && !isValidEnglishCurrency(value)) return;
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
    if (field === 'age' && !isValidEnglishInteger(value)) return;

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
          membershipId: fullClient.membershipId || fullClient.accountNumber,
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

  const handleWriterSelect = (w) => {
    if (w.isNew) {
      setForm(p => ({
        ...p,
        documentWriterId: '',
        documentWriterName: w.fullNameNepali || ''
      }));
    } else {
      setForm(p => ({
        ...p,
        documentWriterId: w.id,
        documentWriterName: w.fullNameNepali || ''
      }));
      
      // Clear errors
      setErrors(prev => {
        const next = { ...prev };
        delete next.documentWriterId;
        return next;
      });
    }
  };

  const validate = () => {
    const newErrs = {};
    if (!form.clientId) newErrs.clientId = 'Please select a main client';
    if (!form.purposeOfLoan) newErrs.purposeOfLoan = 'Required';
    if (!form.loanRepaymentType) newErrs.loanRepaymentType = 'Required';
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
      if (!s._isExisting && !s.age) newErrs[`sk_${i}_age`] = 'Age required';
    });

    if (!form.documentWriterId) {
      newErrs.documentWriterId = 'Please select a document writer from the list';
    }

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

    // Convert English numerals to Nepali before sending to backend
    const payload = {
      ...form,
      purposeOfLoan: Number(form.purposeOfLoan),
      loanRepaymentType: form.loanRepaymentType ? Number(form.loanRepaymentType) : null,
      interestRateFormat: form.interestRateFormat ? Number(form.interestRateFormat) : 0,
      interestRate: englishToNepali(form.interestRate),
      loanAmount: englishToNepali(String(form.loanAmount).replace(/,/g, '')),
      loanRemainingToBePaid: form.loanRemainingToBePaid ? englishToNepali(String(form.loanRemainingToBePaid).replace(/,/g, '')) : null,
      repayDate: { 
        bsDate: typeof form.repayDateBs === 'object' ? form.repayDateBs.bsDate : form.repayDateBs, 
        adDate: typeof form.repayDateBs === 'object' ? form.repayDateBs.adDate : (originalLoan?.repayDateAd || null) 
      },
      dhanjamaniList: form.dhanjamaniList.map(({ _details, ...d }) => ({
        clientId: d.clientId ? Number(d.clientId) : 0,
        amount: englishToNepali(String(d.amount).replace(/,/g, ''))
      })),
      sakshiList: form.sakshiList.map(({ _isExisting, ...s }) => ({
        clientId: s.clientId ? Number(s.clientId) : 0,
        age: s.age ? englishToNepali(String(s.age)) : '०',
        fullNameNepali: s.fullNameNepali || '',
        province: s.province ? Number(s.province) : 0,
        district: s.district ? Number(s.district) : 0,
        localGovernment: s.localGovernment ? Number(s.localGovernment) : 0,
        wardNumber: s.wardNumber ? Number(s.wardNumber) : 0,
        gender: s.gender ? Number(s.gender) : 0
      })),
      documentWriterId: form.documentWriterId ? Number(form.documentWriterId) : null
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
                onSelect={async (c) => {
                  if (c) {
                    setForm(p => ({ ...p, clientId: c.id }));
                    setSelectedMainClientName(`${c.fullNameNepali || c.fullNameEnglish} (${c.membershipId || c.accountNumber})`);
                    setSelectedMainClientId(c.id);
                    if (errors.clientId) setErrors(p => ({ ...p, clientId: null }));
                    // Fetch full client to check completed flag
                    try {
                      const full = await getClientByIdApi(c.id);
                      setSelectedMainClientIncomplete(full.completed === false);
                    } catch {
                      setSelectedMainClientIncomplete(false);
                    }
                  } else {
                    setForm(p => ({ ...p, clientId: '' }));
                    setSelectedMainClientName('');
                    setSelectedMainClientIncomplete(false);
                    setSelectedMainClientId(null);
                  }
                }}
                error={errors.clientId}
                selectedClientDisplay={selectedMainClientName}
                incomplete={selectedMainClientIncomplete}
                incompleteClientId={selectedMainClientId}
                onEditClient={(clientId) => navigate(`/clients/${clientId}/edit`)}
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
              <label>Loan Repayment Type (कर्जा किसिम) *</label>
              <select name="loanRepaymentType" value={form.loanRepaymentType} onChange={(e) => handleMainChange(e)}>
                <option value="">-- Select --</option>
                {repayTypes.map(p => <option key={p.id} value={p.id}>{p.codeValueOptional || p.codeValue}</option>)}
              </select>
              {errors.loanRepaymentType && <span className="form-error">{errors.loanRepaymentType}</span>}
            </div>

            <div className="form-group">
              <label>Interest Rate (% ब्याज दर) *</label>
              <input name="interestRate" value={form.interestRate} onChange={(e) => handleMainChange(e, 'decimal')} placeholder="e.g. 15.5" />
              {errors.interestRate && <span className="form-error">{errors.interestRate}</span>}
            </div>

            <div className="form-group">
              <label>Loan Amount (कर्जा रकम) *</label>
              <input name="loanAmount" value={form.loanAmount} onChange={(e) => handleMainChange(e, 'currency')} placeholder="e.g. 250,000.50" />
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
              <input name="loanRemainingToBePaid" value={form.loanRemainingToBePaid} onChange={(e) => handleMainChange(e, 'currency')} placeholder="e.g. 150,000" />
            </div>

            <div className="form-group">
              <label>Repay Date (मिल्ने मिति) (BS) *</label>
              <NepaliDatePickerWrapper name="repayDateBs" value={form.repayDateBs} className="form-control" onChange={(e) => handleMainChange(e)} />
              {errors.repayDateBs && <span className="form-error">{errors.repayDateBs}</span>}
            </div>
          </div>
        </div>

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
                  <input value={dj.amount} onChange={(e) => handleDhanjamaniChange(index, 'amount', e.target.value)} placeholder="e.g. 50,000" />
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
                      selectedClientDisplay={sk.clientId || sk.fullNameNepali ? `${sk.fullNameNepali} ${sk.membershipId ? `(Mem: ${sk.membershipId})` : `(ID: ${sk.clientId})`}` : ''}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name (नेपाली नाम) *</label>
                    <input value={sk.fullNameNepali} onChange={(e) => handleSakshiChange(index, 'fullNameNepali', e.target.value)} />
                    {errors[`sk_${index}_fullName`] && <span className="form-error">{errors[`sk_${index}_fullName`]}</span>}
                  </div>
                  <div className="form-group">
                    <label>Age (उमेर) *</label>
                    <input value={sk.age} onChange={(e) => handleSakshiChange(index, 'age', e.target.value)} />
                    {errors[`sk_${index}_age`] && <span className="form-error">{errors[`sk_${index}_age`]}</span>}
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

        {/* Writer Section */}
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Writer Details (लेखक विवरण) *</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name (नेपाली नाम) *</label>
              <DocumentWriterSearchSelect 
                value={form.documentWriterName || ''} 
                onSelect={handleWriterSelect} 
                error={errors.documentWriterId} 
              />
            </div>
          </div>
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
