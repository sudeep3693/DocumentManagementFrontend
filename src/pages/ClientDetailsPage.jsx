import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getClientByIdApi, getCodeValuesApi, enableClientApi } from '../services/api';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';
import cache from '../utils/cache';
import './ClientLayout.css';

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

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};

const calculateAge = (dateObj) => {
  if (!dateObj || (!dateObj.adDate && !dateObj.bsDate)) return null;
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

const ClientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Address lookup dictionaries
  const [provinces, setProvinces] = useState({});
  const [districts, setDistricts] = useState({});
  const [municipalities, setMunicipalities] = useState({});
  const [wards, setWards] = useState({});
  
  // Entity lookup dictionaries
  const [spouseTypes, setSpouseTypes] = useState({});
  const [ancestorTypes, setAncestorTypes] = useState({});
  const [nomineeRelations, setNomineeRelations] = useState({});
  const [genders, setGenders] = useState({});
  const [maritalStatuses, setMaritalStatuses] = useState({});

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const cachedCode = (codeId) => {
          const key = `codeValues:${codeId}`;
          const hit = cache.get(key);
          if (hit) return Promise.resolve(hit);
          return getCodeValuesApi(codeId).then((data) => {
            cache.set(key, data); // indefinite TTL for static data
            return data;
          });
        };

        const [provList, wardList, distList, munList, spouseList, ancestorList, nomineeList, genderList, maritalList] = await Promise.all([
          cachedCode(CODE_IDS.PROVINCE).then(extractArray),
          cachedCode(CODE_IDS.WARD).then(extractArray),
          cachedCode(CODE_IDS.DISTRICT).then(extractArray),
          cachedCode(CODE_IDS.MUNICIPALITY).then(extractArray),
          cachedCode(CODE_IDS.SPOUSE_TYPE).then(extractArray),
          cachedCode(CODE_IDS.ANCESTOR_TYPE).then(extractArray),
          cachedCode(CODE_IDS.NOMINEE_RELATION).then(extractArray),
          cachedCode(CODE_IDS.GENDER).then(extractArray),
          cachedCode(CODE_IDS.MARITAL_STATUS).then(extractArray),
        ]);
        
        const arrToMap = (arr) => arr.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.codeValueOptional || curr.codeValue }), {});
        
        setProvinces(arrToMap(provList));
        setWards(arrToMap(wardList));
        setDistricts(arrToMap(distList));
        setMunicipalities(arrToMap(munList));
        setSpouseTypes(arrToMap(spouseList));
        setAncestorTypes(arrToMap(ancestorList));
        setNomineeRelations(arrToMap(nomineeList));
        setGenders(arrToMap(genderList));
        setMaritalStatuses(arrToMap(maritalList));
      } catch (err) {
        console.error('Failed to load code values', err);
      }
    };
    fetchSelects();
  }, []);

  useEffect(() => {
    const fetchClient = async () => {
      const cacheKey = `clients:detail:${id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        setClient(cached);
        setLoading(false);
        return;
      }
      try {
        const data = await getClientByIdApi(id);
        cache.set(cacheKey, data, 300);
        setClient(data);
      } catch (err) {
        toast.error(err.message || 'Failed to load client details');
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id, navigate, toast]);

  const handleEnable = async () => {
    try {
      await enableClientApi(id);
      toast.success('Client enabled successfully');
      // Clear cache and re-fetch fresh data
      cache.invalidate(`clients:detail:${id}`);
      cache.invalidateByPrefix('clients:list:');
      const data = await getClientByIdApi(id);
      cache.set(`clients:detail:${id}`, data, 300);
      setClient(data);
    } catch (err) {
      toast.error(err.message || 'Failed to enable client');
    }
  };

  if (loading || !client) return <DetailSkeleton cards={4} itemsPerCard={6} />;

  const pAddr = client.addresses?.find(a => a.addressType === 'P');
  const tAddr = client.addresses?.find(a => a.addressType === 'T');
  
  const isMinor = client.dateOfBirth?.adDate ? calculateAge(client.dateOfBirth) < 16 : !!client.isMinor;

  const renderAddress = (addr) => {
    if (!addr) return <p>No Address Provided</p>;
    return (
      <div className="form-grid">
        <div className="detail-item"><strong>Province / प्रदेश:</strong><br/>{provinces[addr.province] || addr.province}</div>
        <div className="detail-item"><strong>District / जिल्ला:</strong><br/>{districts[addr.district] || addr.district}</div>
        <div className="detail-item"><strong>Municipality / पालिका:</strong><br/>{municipalities[addr.municipality] || addr.municipality}</div>
        <div className="detail-item"><strong>Ward / वडा नं:</strong><br/>{wards[addr.wardNo] || addr.wardNo}</div>
        <div className="detail-item"><strong>Tole / टोल:</strong><br/>{addr.toleName}</div>
        <div className="detail-item"><strong>House No / घर नं:</strong><br/>{addr.houseNo}</div>
        <div className="detail-item"><strong>Sabik Address / साविक ठेगाना:</strong><br/>{addr.sabikAddress || '—'}</div>
      </div>
    );
  };

  const renderDate = (dateField, fallbackField, clientObj, fieldName) => {
    // 1. Check direct object (e.g. dateOfMembership.bsDate)
    if (typeof dateField === 'object' && dateField?.bsDate) return dateField.bsDate;
    
    // 2. Check direct strings
    if (typeof dateField === 'string' && dateField) return dateField;
    if (typeof fallbackField === 'string' && fallbackField) return fallbackField;
    
    // 3. Check common alternate field names in the client object
    if (clientObj && fieldName === 'membership') {
      if (clientObj.membershipDate) return clientObj.membershipDate;
      if (clientObj.membershipDateBs) return clientObj.membershipDateBs;
    }
    
    return '—';
  };

  return (
    <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Client Details (ग्राहक विवरण)</h1>
          <p className="page-subtitle">Viewing details for {client.fullNameEnglish || client.fullNameNepali}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!client.isActive && (
            <button className="btn btn-success" onClick={handleEnable}>Enable</button>
          )}
          <button className="btn btn-primary" onClick={() => navigate(`/clients/${id}/edit`)}>Edit</button>
          <button className="btn btn-outline" onClick={() => navigate('/clients')}>Back to List</button>
        </div>
      </div>

      <div className="client-form-container">
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">General Information (सामान्य जानकारी)</h3>
          </div>
          <div className="form-grid">
            <div className="detail-item"><strong>Membership ID / सदस्यता नम्बर:</strong><br/>{client.membershipId}</div>
            <div className="detail-item"><strong>Name (English):</strong><br/>{client.fullNameEnglish}</div>
            <div className="detail-item"><strong>पूरा नाम (Nepali):</strong><br/>{client.fullNameNepali}</div>
            <div className="detail-item"><strong>Date of Birth (BS) / जन्म मिति:</strong><br/>{renderDate(client.dateOfBirth, client.dateOfBirthBs)}</div>
            <div className="detail-item"><strong>Gender / लिङ्ग:</strong><br/>{genders[client.gender] || client.gender || '—'}</div>
            <div className="detail-item"><strong>Marital Status / वैवाहिक स्थिति:</strong><br/>{maritalStatuses[client.maritalStatus] || client.maritalStatus || '—'}</div>
            <div className="detail-item"><strong>Membership Date (BS) / सदस्यता मिति:</strong><br/>{renderDate(client.dateOfMembership, client.dateOfMembershipBs, client, 'membership')}</div>
            <div className="detail-item"><strong>Status / अवस्था:</strong><br/>
              <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="detail-item"><strong>Email ID / ईमेल:</strong><br/>{client.emailId || '—'}</div>
            <div className="detail-item"><strong>Mobile Number / मोबाइल नम्बर:</strong><br/>{client.mobileNumber}</div>
          </div>
        </div>

        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Identity & Shares</h3>
          </div>
          <div className="form-grid">
            <div className="detail-item"><strong>{isMinor ? 'Date of Birth No / जन्म दर्ता नम्बर' : 'Citizenship No / नागरिकता नम्बर'}:</strong><br/>{client.citizenshipNumber}</div>
            <div className="detail-item"><strong>{isMinor ? 'DOB Issue District / जन्म दर्ता जारी जिल्ला' : 'Issue District / जारी जिल्ला'}:</strong><br/>{districts[client.citizenshipIssueDistrict] || client.citizenshipIssueDistrict}</div>
            <div className="detail-item"><strong>{isMinor ? 'DOB Issue Date (BS) / जन्म दर्ता जारी मिति' : 'Issue Date (BS) / जारी मिति'}:</strong><br/>{renderDate(client.citizenshipIssueDate, client.citizenshipIssueDateBs)}</div>
            <div className="detail-item"><strong>Share Amount / शेयर रकम:</strong><br/>NPR {client.shareAmount}</div>
            <div className="detail-item"><strong>Share Number / शेयर कित्ता:</strong><br/>{client.shareNumber}</div>
            <div className="detail-item"><strong>Share Certificate No. / शेयर प्रमाणपत्र नं:</strong><br/>{client.shareCertificateNumber || '—'}</div>
          </div>
        </div>

        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Family Information (पारिवारिक विवरण)</h3>
          </div>
          <div className="form-grid">
            <div className="detail-item"><strong>Father (English):</strong><br/>{client.fatherNameEnglish}</div>
            <div className="detail-item"><strong>Father (Nepali) / बुबाको नाम:</strong><br/>{client.fatherNameNepali}</div>
            <div className="detail-item"><strong>Spouse ({spouseTypes[client.spouseType] || client.spouseType || 'N/A'}) / पति/पत्नीको नाम:</strong><br/>
              {client.spouseNameEnglish ? `${client.spouseNameEnglish} / ` : ''}{client.spouseNameNepali || '—'}
            </div>
            <div className="detail-item"><strong>Ancestor ({ancestorTypes[client.ancestorType] || client.ancestorType || 'Ancestor'}) / पुर्खाको नाम:</strong><br/>
              {client.ancestorNameEnglish ? `${client.ancestorNameEnglish} / ` : ''}{client.ancestorNameNepali || '—'}
            </div>
          </div>
        </div>
        

        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Permanent Address (स्थायी ठेगाना)</h3>
          </div>
          {renderAddress(pAddr)}
        </div>

        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Temporary Address (अस्थायी ठेगाना)</h3>
          </div>
          {renderAddress(tAddr)}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailsPage;

