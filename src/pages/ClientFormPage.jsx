import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { addClientApi, updateClientApi, getClientByIdApi, getCodeValuesApi } from '../services/api';
import './ClientLayout.css';
import NepaliDatePickerWrapper from '../components/NepaliDatePickerWrapper';

// Nepali numeral helpers
const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const nepaliToEnglishDigits = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[०-९]/g, (ch) => NEPALI_DIGITS.indexOf(ch).toString());
};

const englishToNepaliDigits = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[0-9]/g, (ch) => NEPALI_DIGITS[parseInt(ch)]);
};

// Validate that input only contains English digits and optionally a decimal point
const isValidEnglishNumeral = (val, allowDecimal = false) => {
  if (!val) return true;
  const pattern = allowDecimal ? /^[0-9.]+$/ : /^[0-9]+$/;
  return pattern.test(val);
};

// Currency helpers — English numerals with comma thousands separator
// Accepts digits, commas, and one decimal point: e.g. "1,500.00"
const isValidCurrencyInput = (val) => {
  if (!val) return true;
  // Allow only digits, commas, and at most one decimal point
  return /^[0-9,]*\.?[0-9]*$/.test(val);
};

// Format a raw number/string as "1,500.00" style (no trailing zeros forced)
const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '';
  // Convert Nepali digits first using NEPALI_DIGITS, then strip commas
  const clean = String(val)
    .replace(/[\u0966-\u096f]/g, (ch) => String(NEPALI_DIGITS.indexOf(ch)))
    .replace(/,/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return '';
  // Format with commas
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Strip commas and return plain numeric string for API (BigDecimal compatible)
const parseCurrencyToNumber = (val) => {
  if (!val) return null;
  const clean = String(val).replace(/,/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
};

// Validates alphanumeric and basic punctuation (dash, slash) for house numbers
const isValidNepaliEnglishNumeral = (val) => {
  if (!val) return true;
  return /^[\u0900-\u097Fa-zA-Z0-9\s/-]*$/.test(val);
};

// Validate Nepali alpha only
const isNepaliAlphaOnly = (val) => {
  if (!val) return true;
  return /^[\u0900-\u0963\u0970-\u097F\s]*$/.test(val);
};

const calculateAge = (dateObj) => {
  if (!dateObj || (!dateObj.adDate && !dateObj.bsDate)) return null;
  // Use adDate if available. If somehow only string is present, returning null allows fallback behavior.
  if (!dateObj.adDate) return null;
  const dob = new Date(dateObj.adDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
};

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
  ANCESTOR_TYPE: 55,
  SPOUSE_TYPE: 56,
  NOMINEE_RELATION: 1003,
  GENDER: 1004,
  MARITAL_STATUS: 1005,
  CASTE: 1006,
};

const emptyAddress = {
  addressType: 'P',
  province: '',
  district: '',
  municipality: '',
  wardNo: '',
  toleName: '',
  houseNo: '',
  sabikAddress: '',
};

const emptyForm = {
  membershipId: '',
  shareAmount: '',
  shareNumber: '',
  shareCertificateNumber: '',
  fullNameNepali: '',
  fullNameEnglish: '',
  gender: '',
  maritalStatus: '',
  castRecordId: '',
  spouseType: '',
  spouseNameNepali: '',
  spouseNameEnglish: '',
  fatherNameEnglish: '',
  fatherNameNepali: '',
  ancestorType: '',
  ancestorNameNepali: '',
  ancestorNameEnglish: '',
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

  const age = form.dateOfBirthBs?.adDate ? calculateAge(form.dateOfBirthBs) : null;
  const isMinor = age !== null && age < 16;

  // General Dropdown options
  const [spouseTypes, setSpouseTypes] = useState([]);
  const [ancestorTypes, setAncestorTypes] = useState([]);
  const [nomineeRelations, setNomineeRelations] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [genders, setGenders] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);
  const [castRecords, setCastRecords] = useState([]);

  // Address Dropdown options
  const [provinces, setProvinces] = useState([]);
  const [pDistricts, setPDistricts] = useState([]);
  const [tDistricts, setTDistricts] = useState([]);
  const [pMunicipalities, setPMunicipalities] = useState([]);
  const [tMunicipalities, setTMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);

  // Semantic helpers – resolved after dropdowns load
  // Find ID of a code entry by English codeValue (case-insensitive)
  const findId = (list, val) => {
    const entry = list.find(x => x.codeValue?.toLowerCase() === val.toLowerCase() || x.codeValueOptional?.toLowerCase() === val.toLowerCase());
    return entry ? entry.id : null;
  };

  // Marital status IDs resolved from loaded lists
  const marriedId   = findId(maritalStatuses, 'Married')   || null;
  const unmarriedId = findId(maritalStatuses, 'Unmarried') || null;
  const divorcedId  = findId(maritalStatuses, 'Divorced')  || null;

  // Gender IDs
  const maleId   = findId(genders, 'Male')   || null;
  const femaleId = findId(genders, 'Female') || null;

  // Ancestor type IDs (codeValue should be 'Grandfather' and 'Father-in-law' or similar)
  const grandfatherId   = findId(ancestorTypes, 'Grandfather')   || findId(ancestorTypes, 'हजुरबुवा') || null;
  const fatherInLawId   = findId(ancestorTypes, 'Father-in-law') || findId(ancestorTypes, 'ससुरा')   || null;

  // Spouse type IDs
  const wifeId    = findId(spouseTypes, 'Wife')    || findId(spouseTypes, 'पत्नी')   || null;
  const husbandId = findId(spouseTypes, 'Husband') || findId(spouseTypes, 'पति')     || null;

  const msId = form.maritalStatus ? Number(form.maritalStatus) : null;
  const gId  = form.gender        ? Number(form.gender)        : null;

  const isMarried   = msId && msId === marriedId;
  const isUnmarried = msId && msId === unmarriedId;
  const isDivorced  = msId && msId === divorcedId;
  const isMale      = gId && gId === maleId;
  const isFemale    = gId && gId === femaleId;

  // Spouse fields disabled when unmarried
  const spouseDisabled = isUnmarried;

  // Suggested ancestorType based on rules (null means free choice)
  const suggestedAncestorId = (() => {
    if (isDivorced) return null; // free choice
    if (isMarried && isMale)   return grandfatherId;
    if (isMarried && isFemale) return fatherInLawId;
    return null;
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prov, wardData, sTypes, aTypes, aDistricts, nRels, gTypes, mTypes, cTypes] = await Promise.all([
          getCodeValuesApi(CODE_IDS.PROVINCE),
          getCodeValuesApi(CODE_IDS.WARD),
          getCodeValuesApi(CODE_IDS.SPOUSE_TYPE),
          getCodeValuesApi(CODE_IDS.ANCESTOR_TYPE),
          getCodeValuesApi(CODE_IDS.DISTRICT),
          getCodeValuesApi(CODE_IDS.NOMINEE_RELATION),
          getCodeValuesApi(CODE_IDS.GENDER),
          getCodeValuesApi(CODE_IDS.MARITAL_STATUS),
          getCodeValuesApi(CODE_IDS.CASTE),
        ]);
        const provincesList = extractArray(prov);
        const wardsList = extractArray(wardData);
        const spouseTypesList = extractArray(sTypes);
        const ancestorTypesList = extractArray(aTypes);
        const allDistrictsList = extractArray(aDistricts);
        const nomineeRelationsList = extractArray(nRels);
        const gendersList = extractArray(gTypes);
        const maritalList = extractArray(mTypes);
        const casteList = extractArray(cTypes);

        setProvinces(provincesList);
        setWards(wardsList);
        setSpouseTypes(spouseTypesList);
        setAncestorTypes(ancestorTypesList);
        setAllDistricts(allDistrictsList);
        setNomineeRelations(nomineeRelationsList);
        setGenders(gendersList);
        setMaritalStatuses(maritalList);
        setCastRecords(casteList);

        if (isEditing) {
          const data = await getClientByIdApi(id);
          const resolve = (list, val) => {
            if (val === null || val === undefined || val === '') return '';
            if (!isNaN(val)) return Number(val);
            const match = list.find(item => item.codeValue === val || item.codeValueOptional === val || item.id == val);
            return match ? match.id : val; 
          };

          let pAddr = { ...emptyAddress, addressType: 'P' };
          let tAddr = { ...emptyAddress, addressType: 'T' };
          
          if (data.addresses && data.addresses.length > 0) {
            const loadAddressCodeIds = async (addr) => {
               if (!addr) return null;
               const provId = resolve(provincesList, addr.province);
               const distId = resolve(allDistrictsList, addr.district);
               let munId = addr.municipality;
               if (distId && addr.municipality && isNaN(addr.municipality)) {
                   try {
                     const munis = extractArray(await getCodeValuesApi(CODE_IDS.MUNICIPALITY, distId));
                     munId = resolve(munis, addr.municipality);
                   } catch {
                     // ignore error
                   }
               } else if (distId && !isNaN(addr.municipality)) {
                   munId = Number(addr.municipality);
               }
               return {
                 ...emptyAddress,
                 ...addr,
                 province: provId,
                 district: distId,
                 municipality: munId,
                 wardNo: resolve(wardsList, addr.wardNo)
               };
            };
            const tempP = data.addresses.find(a => a.addressType === 'P');
            const tempT = data.addresses.find(a => a.addressType === 'T');
            if (tempP) pAddr = (await loadAddressCodeIds(tempP)) || pAddr;
            if (tempT) tAddr = (await loadAddressCodeIds(tempT)) || tAddr;
          }
          setForm({
            ...emptyForm,
            ...data,
            shareAmount: formatCurrency(data.shareAmount),
            shareNumber: nepaliToEnglishDigits(String(data.shareNumber || '')),
            shareCertificateNumber: nepaliToEnglishDigits(String(data.shareCertificateNumber || '')),
            gender: resolve(gendersList, data.gender),
            maritalStatus: resolve(maritalList, data.maritalStatus),
            castRecordId: resolve(casteList, data.castRecord || data.castRecordId),
            spouseType: resolve(spouseTypesList, data.spouseType),
            ancestorType: resolve(ancestorTypesList, data.ancestorType),
            citizenshipIssueDistrict: resolve(allDistrictsList, data.citizenshipIssueDistrict),
            dateOfBirthBs: data.dateOfBirth || null,
            citizenshipIssueDateBs: data.citizenshipIssueDate || null,
            dateOfMembershipBs: data.dateOfMembership || null,
            addresses: [pAddr, tAddr]
          });
        }
      } catch (err) {
        console.error('Failed to load data', err);
        if (isEditing) {
          toast.error(err.message || 'Failed to load client details');
          navigate('/clients');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

    setForm(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-set spouseType when marital status changes
      if (name === 'maritalStatus') {
        const newMs = value ? Number(value) : null;
        const curG  = prev.gender ? Number(prev.gender) : null;
        if (newMs === marriedId && curG === maleId && wifeId) {
          updated.spouseType = String(wifeId);
        } else if (newMs === marriedId && curG === femaleId && husbandId) {
          updated.spouseType = String(husbandId);
        } else if (newMs === unmarriedId) {
          updated.spouseType = '';
          updated.spouseNameNepali = '';
          updated.spouseNameEnglish = '';
        }
        // Auto-set ancestorType
        if (newMs === marriedId && curG === maleId && grandfatherId) {
          updated.ancestorType = String(grandfatherId);
        } else if (newMs === marriedId && curG === femaleId && fatherInLawId) {
          updated.ancestorType = String(fatherInLawId);
        }
      }

      // Auto-set spouseType when gender changes
      if (name === 'gender') {
        const newG  = value ? Number(value) : null;
        const curMs = prev.maritalStatus ? Number(prev.maritalStatus) : null;
        if (curMs === marriedId && newG === maleId && wifeId) {
          updated.spouseType = String(wifeId);
        } else if (curMs === marriedId && newG === femaleId && husbandId) {
          updated.spouseType = String(husbandId);
        }
        // Auto-set ancestorType
        if (curMs === marriedId && newG === maleId && grandfatherId) {
          updated.ancestorType = String(grandfatherId);
        } else if (curMs === marriedId && newG === femaleId && fatherInLawId) {
          updated.ancestorType = String(fatherInLawId);
        }
      }

      return updated;
    });

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleAddressChange = (index, field, value) => {
    setForm(prev => {
      const newAddresses = [...prev.addresses];
      let parsedValue;
      if (field === 'houseNo') {
        // houseNo accepts Nepali/English numerals as string
        parsedValue = value;
      } else if (['province', 'district', 'municipality', 'wardNo'].includes(field)) {
        parsedValue = value ? Number(value) : '';
      } else {
        parsedValue = value;
      }
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
    if (!form.membershipId) newErrs.membershipId = 'Required';
    if (!form.fullNameNepali) newErrs.fullNameNepali = 'Required';
    if (!form.fullNameEnglish) newErrs.fullNameEnglish = 'Required';
    if (!form.gender) newErrs.gender = 'Required';
    if (!form.maritalStatus) newErrs.maritalStatus = 'Required';
    if (!form.fatherNameEnglish) newErrs.fatherNameEnglish = 'Required';
    if (!form.fatherNameNepali) newErrs.fatherNameNepali = 'Required';
    if (!form.ancestorType) newErrs.ancestorType = 'Required';
    if (!form.ancestorNameNepali) newErrs.ancestorNameNepali = 'Required';
    if (!form.ancestorNameEnglish) newErrs.ancestorNameEnglish = 'Required';
    if (!form.citizenshipNumber) newErrs.citizenshipNumber = 'Required';
    if (!form.citizenshipIssueDistrict) newErrs.citizenshipIssueDistrict = 'Required';
    if (!form.dateOfMembershipBs) newErrs.dateOfMembershipBs = 'Required';
    if (!form.mobileNumber) newErrs.mobileNumber = 'Required';

    // Spouse required when married
    if (isMarried) {
      if (!form.spouseNameNepali) newErrs.spouseNameNepali = 'Required when married';
      if (!form.spouseNameEnglish) newErrs.spouseNameEnglish = 'Required when married';
    }

    // Block minors
    if (isMinor) {
      newErrs._minor = 'Client must be at least 16 years old to submit';
    }

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
    // shareAmount sent as BigDecimal (plain number), shareNumber/shareCertificateNumber as Nepali numerals
    payload.shareAmount = parseCurrencyToNumber(form.shareAmount);
    payload.shareNumber = form.shareNumber ? englishToNepaliDigits(String(form.shareNumber)) : null;
    payload.shareCertificateNumber = form.shareCertificateNumber ? englishToNepaliDigits(String(form.shareCertificateNumber)) : null;
    
    // Parse Long fields
    payload.gender = form.gender ? Number(form.gender) : null;
    payload.spouseType = form.spouseType ? Number(form.spouseType) : null;
    payload.ancestorType = form.ancestorType ? Number(form.ancestorType) : null;
    payload.maritalStatus = form.maritalStatus ? Number(form.maritalStatus) : null;
    payload.castRecordId = form.castRecordId ? Number(form.castRecordId) : null;
    payload.citizenshipIssueDistrict = form.citizenshipIssueDistrict ? Number(form.citizenshipIssueDistrict) : null;

    const extractDateObj = (dateField) => {
      if (!dateField) return null;
      if (typeof dateField === 'object') {
        return {
          bsDate: dateField.bsDate,
          adDate: dateField.adDate
        };
      }
      return { bsDate: dateField, adDate: null };
    };

    // Convert dates back to objects
    payload.dateOfBirth = extractDateObj(form.dateOfBirthBs);
    payload.citizenshipIssueDate = extractDateObj(form.citizenshipIssueDateBs);
    payload.dateOfMembership = extractDateObj(form.dateOfMembershipBs);
    
    delete payload.dateOfBirthBs;
    delete payload.citizenshipIssueDateBs;
    delete payload.dateOfMembershipBs;

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
      toast.error(err.message || 'Failed to save client');
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
              <label>Membership ID *</label>
              <input name="membershipId" value={form.membershipId} onChange={handleChange} disabled={isEditing} />
              {errors.membershipId && <span className="form-error">{errors.membershipId}</span>}
            </div>
            <div className="form-group">
              <label>पूरा नाम (Full Name Nepali) *</label>
              <input name="fullNameNepali" value={form.fullNameNepali} onChange={(e) => { if (isNepaliAlphaOnly(e.target.value)) handleChange(e); }} />
              {errors.fullNameNepali && <span className="form-error">{errors.fullNameNepali}</span>}
            </div>
            <div className="form-group">
              <label>Full Name (English) *</label>
              <input name="fullNameEnglish" value={form.fullNameEnglish} onChange={handleChange} />
              {errors.fullNameEnglish && <span className="form-error">{errors.fullNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>Gender / लिङ्ग *</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">-- Select --</option>
                {genders.map(g => <option key={g.id} value={g.id}>{g.codeValueOptional || g.codeValue}</option>)}
              </select>
              {errors.gender && <span className="form-error">{errors.gender}</span>}
            </div>
            <div className="form-group">
              <label>Marital Status / वैवाहिक स्थिति *</label>
              <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange}>
                <option value="">-- Select --</option>
                {maritalStatuses.map(m => <option key={m.id} value={m.id}>{m.codeValueOptional || m.codeValue}</option>)}
              </select>
              {errors.maritalStatus && <span className="form-error">{errors.maritalStatus}</span>}
            </div>
            <div className="form-group">
              <label>Caste / जाति</label>
              <select name="castRecordId" value={form.castRecordId} onChange={handleChange}>
                <option value="">-- Select --</option>
                {castRecords.map(c => <option key={c.id} value={c.id}>{c.codeValueOptional || c.codeValue}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>जन्म मिति / Date of Birth (BS)</label>
              <NepaliDatePickerWrapper name="dateOfBirthBs" value={form.dateOfBirthBs?.bsDate || form.dateOfBirthBs || ''} className="form-control" onChange={handleChange} />
              {isMinor && (
                <span className="form-error">⚠ Client is under 16 — cannot submit until at least 16 years old</span>
              )}
            </div>
            <div className="form-group">
              <label>सदस्यता मिति / Membership Date (BS) *</label>
              <NepaliDatePickerWrapper name="dateOfMembershipBs" value={form.dateOfMembershipBs?.bsDate || form.dateOfMembershipBs || ''} className="form-control" onChange={handleChange} />
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
              <input
                type="text"
                name="shareAmount"
                value={form.shareAmount}
                onChange={(e) => { if (isValidCurrencyInput(e.target.value)) handleChange(e); }}
                onBlur={(e) => {
                  // Re-format with commas on blur
                  const formatted = formatCurrency(e.target.value);
                  setForm(prev => ({ ...prev, shareAmount: formatted }));
                }}
                placeholder="e.g. 1,500.00"
              />
            </div>
            <div className="form-group">
              <label>Share Number / शेयर कित्ता</label>
              <input type="text" name="shareNumber" value={form.shareNumber} onChange={(e) => { if (isValidEnglishNumeral(e.target.value)) handleChange(e); }} placeholder="e.g. 4" />
            </div>
            <div className="form-group">
              <label>Share Certificate No. / शेयर प्रमाणपत्र नं</label>
              <input type="text" name="shareCertificateNumber" value={form.shareCertificateNumber} onChange={(e) => { if (isValidEnglishNumeral(e.target.value)) handleChange(e); }} placeholder="e.g. 1001" />
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
              <label>{isMinor ? 'Date of Birth Number / जन्म दर्ता नम्बर *' : 'Citizenship Number / नागरिकता नम्बर *'}</label>
              <input name="citizenshipNumber" value={form.citizenshipNumber} onChange={handleChange} />
              {errors.citizenshipNumber && <span className="form-error">{errors.citizenshipNumber}</span>}
            </div>
            <div className="form-group">
              <label>{isMinor ? 'DOB Issue District / जन्म दर्ता जारी जिल्ला *' : 'Issue District / जारी जिल्ला *'}</label>
              <select name="citizenshipIssueDistrict" value={form.citizenshipIssueDistrict} onChange={handleChange}>
                <option value="">-- Select District --</option>
                {allDistricts.map(d => <option key={d.id} value={d.id}>{d.codeValueOptional || d.codeValue}</option>)}
              </select>
              {errors.citizenshipIssueDistrict && <span className="form-error">{errors.citizenshipIssueDistrict}</span>}
            </div>
            <div className="form-group">
              <label>{isMinor ? 'DOB Issue Date / जन्म दर्ता जारी मिति (BS) *' : 'Issue Date / जारी मिति (BS) *'}</label>
              <NepaliDatePickerWrapper name="citizenshipIssueDateBs" value={form.citizenshipIssueDateBs?.bsDate || form.citizenshipIssueDateBs || ''} className="form-control" onChange={handleChange} />
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
              <input name="fatherNameNepali" value={form.fatherNameNepali} onChange={(e) => { if (isNepaliAlphaOnly(e.target.value)) handleChange(e); }} />
              {errors.fatherNameNepali && <span className="form-error">{errors.fatherNameNepali}</span>}
            </div>
            <div className="form-group">
              <label>Father Name (English) *</label>
              <input name="fatherNameEnglish" value={form.fatherNameEnglish} onChange={handleChange} />
              {errors.fatherNameEnglish && <span className="form-error">{errors.fatherNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>Spouse Type / पति/पत्नी प्रकार {isMarried && '*'}</label>
              <select
                name="spouseType"
                value={form.spouseType}
                onChange={handleChange}
                disabled={spouseDisabled}
              >
                <option value="">-- Select --</option>
                {spouseTypes.map(s => <option key={s.id} value={s.id}>{s.codeValueOptional || s.codeValue}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>पति/पत्नीको नाम (Spouse Name Nepali) {isMarried && '*'}</label>
              <input
                name="spouseNameNepali"
                value={form.spouseNameNepali}
                onChange={(e) => { if (isNepaliAlphaOnly(e.target.value)) handleChange(e); }}
                disabled={spouseDisabled}
              />
              {errors.spouseNameNepali && <span className="form-error">{errors.spouseNameNepali}</span>}
            </div>
            <div className="form-group">
              <label>Spouse Name (English) {isMarried && '*'}</label>
              <input
                name="spouseNameEnglish"
                value={form.spouseNameEnglish}
                onChange={handleChange}
                disabled={spouseDisabled}
              />
              {errors.spouseNameEnglish && <span className="form-error">{errors.spouseNameEnglish}</span>}
            </div>
            <div className="form-group"></div>

            <div className="form-group">
              <label>Ancestor Type / पुर्खा प्रकार *
                {suggestedAncestorId && !isDivorced && (
                  <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', color: '#6b7280', fontWeight: 'normal' }}>
                    ({isMarried && isMale ? 'Grandfather' : isMarried && isFemale ? 'Father-in-law' : ''})
                  </span>
                )}
              </label>
              <select
                name="ancestorType"
                value={form.ancestorType}
                onChange={handleChange}
                disabled={!isDivorced && !!suggestedAncestorId}
              >
                <option value="">-- Select --</option>
                {ancestorTypes.map(a => <option key={a.id} value={a.id}>{a.codeValueOptional || a.codeValue}</option>)}
              </select>
              {errors.ancestorType && <span className="form-error">{errors.ancestorType}</span>}
            </div>
            <div className="form-group">
              <label>पुर्खाको नाम (Ancestor Name Nepali) *</label>
              <input name="ancestorNameNepali" value={form.ancestorNameNepali} onChange={(e) => { if (isNepaliAlphaOnly(e.target.value)) handleChange(e); }} />
              {errors.ancestorNameNepali && <span className="form-error">{errors.ancestorNameNepali}</span>}
            </div>
            <div className="form-group">
              <label>Ancestor Name (English) *</label>
              <input name="ancestorNameEnglish" value={form.ancestorNameEnglish} onChange={handleChange} />
              {errors.ancestorNameEnglish && <span className="form-error">{errors.ancestorNameEnglish}</span>}
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
              <input type="text" value={form.addresses[0].houseNo} onChange={(e) => handleAddressChange(0, 'houseNo', e.target.value)} placeholder="e.g. 44" />
            </div>
            <div className="form-group">
              <label>Sabik Address / साविक ठेगाना</label>
              <input value={form.addresses[0].sabikAddress || ''} onChange={(e) => handleAddressChange(0, 'sabikAddress', e.target.value)} />
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
              <input type="text" value={form.addresses[1].houseNo} onChange={(e) => handleAddressChange(1, 'houseNo', e.target.value)} placeholder="e.g. 44" />
            </div>
            <div className="form-group">
              <label>Sabik Address / साविक ठेगाना</label>
              <input value={form.addresses[1].sabikAddress || ''} onChange={(e) => handleAddressChange(1, 'sabikAddress', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="form-actions-footer">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/clients')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving || isMinor}>
            {saving ? 'Saving...' : isEditing ? 'Update Client' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientFormPage;
