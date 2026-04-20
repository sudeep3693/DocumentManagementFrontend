import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { addClientApi, updateClientApi, getClientByIdApi, getCodeValuesApi } from '../services/api';
import './ClientLayout.css';
import NepaliDatePickerWrapper from '../components/NepaliDatePickerWrapper';
import { isValidNumberWithSymbols, convertToNepaliDigits, hasNoNepali, isEnglishNumber } from '../utils/validation';
import NepaliInput from '../components/NepaliInput';
import FormSkeleton from '../components/skeletons/FormSkeleton';
import cache from '../utils/cache';
import { transliterateToNepali } from '../utils/transliteration';

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
  // Tracks which English→Nepali auto-fills have already fired (create mode only).
  // Once a field is in this set, further English edits won't overwrite Nepali.
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());

  const age = form.dateOfBirthBs?.adDate ? calculateAge(form.dateOfBirthBs) : null;
  const isMinor = age !== null && age < 16;

  // General Dropdown options
  const [spouseTypes, setSpouseTypes] = useState([]);
  const [ancestorTypes, setAncestorTypes] = useState([]);
  const [nomineeRelations, setNomineeRelations] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [genders, setGenders] = useState([]);
  const [maritalStatuses, setMaritalStatuses] = useState([]);

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
        ]);
        const provincesList = extractArray(prov);
        const wardsList = extractArray(wardData);
        const spouseTypesList = extractArray(sTypes);
        const ancestorTypesList = extractArray(aTypes);
        const allDistrictsList = extractArray(aDistricts);
        const nomineeRelationsList = extractArray(nRels);
        const gendersList = extractArray(gTypes);
        const maritalList = extractArray(mTypes);

        setProvinces(provincesList);
        setWards(wardsList);
        setSpouseTypes(spouseTypesList);
        setAncestorTypes(ancestorTypesList);
        setAllDistricts(allDistrictsList);
        setNomineeRelations(nomineeRelationsList);
        setGenders(gendersList);
        setMaritalStatuses(maritalList);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

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

  // Mapping: English field name → its Nepali counterpart field name
  const ENGLISH_TO_NEPALI_FIELD = {
    fullNameEnglish:    'fullNameNepali',
    fatherNameEnglish:  'fatherNameNepali',
    spouseNameEnglish:  'spouseNameNepali',
    ancestorNameEnglish:'ancestorNameNepali',
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    const nepaliDigitFields = [
      'membershipId',
      'shareAmountNumber',
      'shareCertificateNumber',
      'citizenshipNumber',
      'dateOfBirthNumber',
    ];

    if (nepaliDigitFields.includes(name)) {
      if (value && !isValidNumberWithSymbols(value)) return;
      value = convertToNepaliDigits(value);
    }

    if (name === 'mobileNumber') {
      if (!isEnglishNumber(value)) return;
    }

    if (name === 'emailId' && !hasNoNepali(value)) return;

    // If user manually edits a Nepali field, lock it so auto-fill won't overwrite it.
    const nepaliFieldSources = Object.values(ENGLISH_TO_NEPALI_FIELD);
    if (nepaliFieldSources.includes(name)) {
      setAutoFilledFields(prev => new Set(prev).add(name));
    }

    setForm(prev => {
      const updated = { ...prev, [name]: value };

      // ── Auto-transliterate English → Nepali (create mode, while field is active) ──
      // Locking happens on blur, not here — so every keystroke keeps updating.
      if (!isEditing && ENGLISH_TO_NEPALI_FIELD[name]) {
        const nepaliField = ENGLISH_TO_NEPALI_FIELD[name];
        if (!autoFilledFields.has(nepaliField)) {
          updated[nepaliField] = transliterateToNepali(value);
        }
      }

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

  /**
   * Called when an English name field loses focus.
   * Locks the Nepali counterpart so further English edits won't overwrite it.
   */
  const handleEnglishBlur = (englishFieldName) => {
    const nepaliField = ENGLISH_TO_NEPALI_FIELD[englishFieldName];
    if (nepaliField) {
      setAutoFilledFields(prev => new Set(prev).add(nepaliField));
    }
  };

  const handleAddressChange = (index, field, value) => {
    setForm(prev => {
      const newAddresses = [...prev.addresses];
      let parsedValue;
      if (field === 'houseNo') {
        if (value && !isValidNumberWithSymbols(value)) return prev;
        parsedValue = convertToNepaliDigits(value);
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
        // Invalidate caches for this client and the list
        cache.invalidate(`clients:detail:${id}`);
        cache.invalidateByPrefix('clients:list:');
        // Re-fetch fresh data and store in cache
        try {
          const fresh = await getClientByIdApi(id);
          cache.set(`clients:detail:${id}`, fresh, 300);
        } catch {}
      } else {
        await addClientApi(payload);
        toast.success('Client added successfully');
        cache.invalidateByPrefix('clients:list:');
      }
      navigate('/clients');
    } catch (err) {
      toast.error(err.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton sections={4} fieldsPerSection={6} />;

  /* Section header with icon and accent */
  const SectionHeader = ({ icon, title, accentColor = 'var(--primary-500)', actions }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 1.25rem',
      borderBottom: '1px solid var(--gray-100)',
      borderLeft: `3px solid ${accentColor}`,
      background: 'var(--gray-50)',
      borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      margin: '-1.25rem -1.5rem 1rem -1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-800)' }}>{title}</h3>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );

  return (
    <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back navigation */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/clients')} style={{ gap: '0.35rem' }}>
          <span>←</span> Back to Clients
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>{isEditing ? 'Edit Client (ग्राहक सम्पादन)' : 'Add Client (नयाँ ग्राहक)'}</h1>
          <p className="page-subtitle">Fill in the client details carefully</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="client-form-container">
        
        {/* General Information */}
        <div className="form-section-card">
          <SectionHeader icon="👤" title="General Information (सामान्य जानकारी)" accentColor="var(--primary-500)" />
          <div className="form-grid">
            <div className="form-group">
              <label>Membership ID *</label>
              <input name="membershipId" value={form.membershipId} onChange={handleChange} disabled={isEditing} />
              {errors.membershipId && <span className="form-error">{errors.membershipId}</span>}
            </div>
            <div className="form-group">
              <label>Full Name (English) *</label>
              <input
                name="fullNameEnglish"
                value={form.fullNameEnglish}
                onChange={handleChange}
                onBlur={() => handleEnglishBlur('fullNameEnglish')}
              />
              {errors.fullNameEnglish && <span className="form-error">{errors.fullNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>
                पूरा नाम (Full Name Nepali) *
                {!isEditing && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>✦ auto</span>}
              </label>
              <NepaliInput name="fullNameNepali" value={form.fullNameNepali} onChange={handleChange} />
              {errors.fullNameNepali && <span className="form-error">{errors.fullNameNepali}</span>}
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
          <SectionHeader icon="💰" title="Shares Information (शेयर विवरण)" accentColor="var(--success-500)" />
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
          <SectionHeader icon="🪨" title="Identity Information (परिचय विवरण)" accentColor="var(--info-500)" />
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
          <SectionHeader icon="👨‍👩‍👧" title="Family Information (पारिवारिक विवरण)" accentColor="var(--warning-500)" />
          <div className="form-grid">
            <div className="form-group">
              <label>Father Name (English) *</label>
              <input
                name="fatherNameEnglish"
                value={form.fatherNameEnglish}
                onChange={handleChange}
                onBlur={() => handleEnglishBlur('fatherNameEnglish')}
              />
              {errors.fatherNameEnglish && <span className="form-error">{errors.fatherNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>
                बुबाको नाम (Father Name Nepali) *
                {!isEditing && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>✦ auto</span>}
              </label>
              <NepaliInput name="fatherNameNepali" value={form.fatherNameNepali} onChange={handleChange} />
              {errors.fatherNameNepali && <span className="form-error">{errors.fatherNameNepali}</span>}
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
              <label>Spouse Name (English) {isMarried && '*'}</label>
              <input
                name="spouseNameEnglish"
                value={form.spouseNameEnglish}
                onChange={handleChange}
                onBlur={() => handleEnglishBlur('spouseNameEnglish')}
                disabled={spouseDisabled}
              />
              {errors.spouseNameEnglish && <span className="form-error">{errors.spouseNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>
                पति/पत्नीको नाम (Spouse Name Nepali) {isMarried && '*'}
                {!isEditing && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>✦ auto</span>}
              </label>
              <NepaliInput
                name="spouseNameNepali"
                value={form.spouseNameNepali}
                onChange={handleChange}
                disabled={spouseDisabled}
              />
              {errors.spouseNameNepali && <span className="form-error">{errors.spouseNameNepali}</span>}
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
              <label>Ancestor Name (English) *</label>
              <input
                name="ancestorNameEnglish"
                value={form.ancestorNameEnglish}
                onChange={handleChange}
                onBlur={() => handleEnglishBlur('ancestorNameEnglish')}
              />
              {errors.ancestorNameEnglish && <span className="form-error">{errors.ancestorNameEnglish}</span>}
            </div>
            <div className="form-group">
              <label>
                पुर्खाको नाम (Ancestor Name Nepali) *
                {!isEditing && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>✦ auto</span>}
              </label>
              <NepaliInput name="ancestorNameNepali" value={form.ancestorNameNepali} onChange={handleChange} />
              {errors.ancestorNameNepali && <span className="form-error">{errors.ancestorNameNepali}</span>}
            </div>
          </div>
        </div>
        

        {/* Permanent Address */}
        <div className="form-section-card">
          <SectionHeader icon="🏠" title="Permanent Address (स्थायी ठेगाना)" accentColor="var(--success-500)" />
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
              <NepaliInput value={form.addresses[0].toleName} onChange={(e) => handleAddressChange(0, 'toleName', e.target.value)} />
              {errors.address_0_toleName && <span className="form-error">{errors.address_0_toleName}</span>}
            </div>
            <div className="form-group">
              <label>House No / घर नं</label>
              <input type="text" value={form.addresses[0].houseNo} onChange={(e) => handleAddressChange(0, 'houseNo', e.target.value)} placeholder="e.g. 44" />
            </div>
            <div className="form-group">
              <label>Sabik Address / साविक ठेगाना</label>
              <NepaliInput value={form.addresses[0].sabikAddress || ''} onChange={(e) => handleAddressChange(0, 'sabikAddress', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Temporary Address */}
        <div className="form-section-card">
          <SectionHeader icon="📍" title="Temporary Address (अस्थायी ठेगाना)" accentColor="var(--gray-400)" actions={
            <button type="button" className="btn btn-sm btn-outline" onClick={copyPermanentToTemporary}>
              Same as Permanent
            </button>
          } />
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
              <NepaliInput value={form.addresses[1].toleName} onChange={(e) => handleAddressChange(1, 'toleName', e.target.value)} />
              {errors.address_1_toleName && <span className="form-error">{errors.address_1_toleName}</span>}
            </div>
            <div className="form-group">
              <label>House No / घर नं</label>
              <input type="text" value={form.addresses[1].houseNo} onChange={(e) => handleAddressChange(1, 'houseNo', e.target.value)} placeholder="e.g. 44" />
            </div>
            <div className="form-group">
              <label>Sabik Address / साविक ठेगाना</label>
              <NepaliInput value={form.addresses[1].sabikAddress || ''} onChange={(e) => handleAddressChange(1, 'sabikAddress', e.target.value)} />
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
