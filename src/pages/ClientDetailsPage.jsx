import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getClientByIdApi, getCodeValuesApi, enableClientApi } from '../services/api';
import DetailSkeleton from '../components/skeletons/DetailSkeleton';
import cache from '../utils/cache';

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

/* ─── Reusable detail field ─── */
const Field = ({ label, value, full }) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.3rem' }}>
      {label}
    </div>
    <div style={{ fontSize: '0.9rem', color: 'var(--gray-800)', fontWeight: 500 }}>
      {value || '—'}
    </div>
  </div>
);

/* ─── Section card with subtle left accent ─── */
const Section = ({ icon, title, accentColor = 'var(--primary-500)', children }) => (
  <div style={{
    background: '#fff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      padding: '0.85rem 1.25rem',
      borderBottom: '1px solid var(--gray-100)',
      borderLeft: `3px solid ${accentColor}`,
      background: 'var(--gray-50)',
    }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--gray-800)' }}>{title}</h3>
    </div>
    <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.15rem' }}>
      {children}
    </div>
  </div>
);

const ClientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [provinces, setProvinces] = useState({});
  const [districts, setDistricts] = useState({});
  const [municipalities, setMunicipalities] = useState({});
  const [wards, setWards] = useState({});
  const [spouseTypes, setSpouseTypes] = useState({});
  const [ancestorTypes, setAncestorTypes] = useState({});
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
            cache.set(key, data);
            return data;
          });
        };

        const [provList, wardList, distList, munList, spouseList, ancestorList, , genderList, maritalList] = await Promise.all([
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

  const renderDate = (dateField, fallbackField, clientObj, fieldName) => {
    if (typeof dateField === 'object' && dateField?.bsDate) return dateField.bsDate;
    if (typeof dateField === 'string' && dateField) return dateField;
    if (typeof fallbackField === 'string' && fallbackField) return fallbackField;
    if (clientObj && fieldName === 'membership') {
      if (clientObj.membershipDate) return clientObj.membershipDate;
      if (clientObj.membershipDateBs) return clientObj.membershipDateBs;
    }
    return '—';
  };

  const formatAddr = (addr) => {
    if (!addr) return null;
    return [addr.toleName, addr.wardNo ? `Ward ${wards[addr.wardNo] || addr.wardNo}` : null, municipalities[addr.municipality] || addr.municipality, districts[addr.district] || addr.district, provinces[addr.province] || addr.province].filter(Boolean).join(', ');
  };

  const isActive = client.isActive;
  const age = calculateAge(client.dateOfBirth);

  return (
    <div className="page-content" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* ─── Top navigation ─── */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn btn-sm btn-outline" onClick={() => navigate('/clients')} style={{ gap: '0.35rem' }}>
          <span>←</span> Back to Clients
        </button>
      </div>

      {/* ─── Status Banner + Header ─── */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
        overflow: 'hidden',
      }}>
        {/* Status strip */}
        <div style={{
          height: '4px',
          background: isActive
            ? 'linear-gradient(90deg, var(--success-500), var(--success-600))'
            : 'linear-gradient(90deg, var(--danger-400), var(--danger-600))',
        }} />
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-700)',
              flexShrink: 0,
            }}>
              {(client.fullNameEnglish || client.fullNameNepali || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                  {client.fullNameEnglish || client.fullNameNepali}
                </h1>
                <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                  {isActive ? '● Active' : '● Inactive'}
                </span>
                {isMinor && (
                  <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Minor</span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: '0.2rem 0 0' }}>
                Member ID: <strong style={{ color: 'var(--gray-700)' }}>{client.membershipId}</strong>
                {client.mobileNumber && (<> &nbsp;·&nbsp; {client.mobileNumber}</>)}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            {!isActive && (
              <button className="btn btn-success btn-sm" onClick={handleEnable}>Enable</button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/clients/${id}/edit`)}>Edit Client</button>
          </div>
        </div>
      </div>

      {/* ─── Sections ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* General Information */}
        <Section icon="👤" title="General Information (सामान्य जानकारी)" accentColor="var(--primary-500)">
          <Field label="Full Name (English)" value={client.fullNameEnglish} />
          <Field label="पूरा नाम (Nepali)" value={client.fullNameNepali} />
          <Field label="Date of Birth (BS) / जन्म मिति" value={renderDate(client.dateOfBirth, client.dateOfBirthBs)} />
          <Field label="Age" value={age !== null ? `${age} years` : null} />
          <Field label="Gender / लिङ्ग" value={genders[client.gender] || client.gender} />
          <Field label="Marital Status / वैवाहिक स्थिति" value={maritalStatuses[client.maritalStatus] || client.maritalStatus} />
          <Field label="Email / ईमेल" value={client.emailId} />
          <Field label="Mobile / मोबाइल" value={client.mobileNumber} />
          <Field label="Membership Date (BS) / सदस्यता मिति" value={renderDate(client.dateOfMembership, client.dateOfMembershipBs, client, 'membership')} />
        </Section>

        {/* Identity & Shares */}
        <Section icon="🪪" title={isMinor ? 'Birth Registration & Shares' : 'Identity & Shares (परिचय र शेयर)'} accentColor="var(--info-500)">
          <Field label={isMinor ? 'Birth Registration No / जन्म दर्ता नं' : 'Citizenship No / नागरिकता नं'} value={client.citizenshipNumber} />
          <Field label={isMinor ? 'DOB Issue District / जन्म दर्ता जारी जिल्ला' : 'Issue District / जारी जिल्ला'} value={districts[client.citizenshipIssueDistrict] || client.citizenshipIssueDistrict} />
          <Field label={isMinor ? 'DOB Issue Date (BS)' : 'Issue Date (BS) / जारी मिति'} value={renderDate(client.citizenshipIssueDate, client.citizenshipIssueDateBs)} />
          <Field label="Share Amount / शेयर रकम" value={client.shareAmount ? `NPR ${client.shareAmount}` : null} />
          <Field label="Share Number / शेयर कित्ता" value={client.shareNumber} />
          <Field label="Share Certificate No / शेयर प्रमाणपत्र नं" value={client.shareCertificateNumber} />
        </Section>

        {/* Family */}
        <Section icon="👨‍👩‍👧" title="Family Information (पारिवारिक विवरण)" accentColor="var(--warning-500)">
          <Field label="Father (English)" value={client.fatherNameEnglish} />
          <Field label="बुबाको नाम (Nepali)" value={client.fatherNameNepali} />
          <Field
            label={`Spouse (${spouseTypes[client.spouseType] || client.spouseType || 'N/A'}) / पति/पत्नी`}
            value={[client.spouseNameEnglish, client.spouseNameNepali].filter(Boolean).join(' / ') || null}
          />
          <Field
            label={`Ancestor (${ancestorTypes[client.ancestorType] || client.ancestorType || 'Ancestor'}) / पुर्खा`}
            value={[client.ancestorNameEnglish, client.ancestorNameNepali].filter(Boolean).join(' / ') || null}
          />
        </Section>

        {/* Permanent Address */}
        <Section icon="🏠" title="Permanent Address (स्थायी ठेगाना)" accentColor="var(--success-500)">
          {pAddr ? (
            <>
              <Field label="Province / प्रदेश" value={provinces[pAddr.province] || pAddr.province} />
              <Field label="District / जिल्ला" value={districts[pAddr.district] || pAddr.district} />
              <Field label="Municipality / पालिका" value={municipalities[pAddr.municipality] || pAddr.municipality} />
              <Field label="Ward / वडा नं" value={wards[pAddr.wardNo] || pAddr.wardNo} />
              <Field label="Tole / टोल" value={pAddr.toleName} />
              <Field label="House No / घर नं" value={pAddr.houseNo} />
              <Field label="Sabik Address / साविक ठेगाना" value={pAddr.sabikAddress} full />
            </>
          ) : (
            <div style={{ gridColumn: '1 / -1', color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.875rem' }}>No permanent address provided.</div>
          )}
        </Section>

        {/* Temporary Address */}
        <Section icon="📍" title="Temporary Address (अस्थायी ठेगाना)" accentColor="var(--gray-400)">
          {tAddr ? (
            <>
              <Field label="Province / प्रदेश" value={provinces[tAddr.province] || tAddr.province} />
              <Field label="District / जिल्ला" value={districts[tAddr.district] || tAddr.district} />
              <Field label="Municipality / पालिका" value={municipalities[tAddr.municipality] || tAddr.municipality} />
              <Field label="Ward / वडा नं" value={wards[tAddr.wardNo] || tAddr.wardNo} />
              <Field label="Tole / टोल" value={tAddr.toleName} />
              <Field label="House No / घर नं" value={tAddr.houseNo} />
              <Field label="Sabik Address / साविक ठेगाना" value={tAddr.sabikAddress} full />
            </>
          ) : (
            <div style={{ gridColumn: '1 / -1', color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.875rem' }}>No temporary address provided.</div>
          )}
        </Section>
      </div>
    </div>
  );
};

export default ClientDetailsPage;
