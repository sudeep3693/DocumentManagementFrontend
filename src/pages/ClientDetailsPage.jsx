import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { getClientByIdApi, getCodeValuesApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './ClientLayout.css';

const CODE_IDS = {
  PROVINCE: 1001,
  DISTRICT: 1002,
  MUNICIPALITY: 1,
  WARD: 2,
  ANCESTOR_TYPE: 55,
  SPOUSE_TYPE: 56,
};

const extractArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.data && data.data.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
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

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [provList, wardList, distList, munList, spouseList, ancestorList] = await Promise.all([
          getCodeValuesApi(CODE_IDS.PROVINCE).then(extractArray),
          getCodeValuesApi(CODE_IDS.WARD).then(extractArray),
          getCodeValuesApi(CODE_IDS.DISTRICT).then(extractArray),
          getCodeValuesApi(CODE_IDS.MUNICIPALITY).then(extractArray),
          getCodeValuesApi(CODE_IDS.SPOUSE_TYPE).then(extractArray),
          getCodeValuesApi(CODE_IDS.ANCESTOR_TYPE).then(extractArray),
        ]);
        
        const arrToMap = (arr) => arr.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.codeValueOptional || curr.codeValue }), {});
        
        setProvinces(arrToMap(provList));
        setWards(arrToMap(wardList));
        setDistricts(arrToMap(distList));
        setMunicipalities(arrToMap(munList));
        setSpouseTypes(arrToMap(spouseList));
        setAncestorTypes(arrToMap(ancestorList));
      } catch (err) {
        console.error('Failed to load code values', err);
      }
    };
    fetchSelects();
  }, []);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const data = await getClientByIdApi(id);
        setClient(data);
      } catch (err) {
        toast.error('Failed to load client details');
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id, navigate, toast]);

  if (loading || !client) return <LoadingSpinner />;

  const pAddr = client.addresses?.find(a => a.addressType === 'P');
  const tAddr = client.addresses?.find(a => a.addressType === 'T');

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
      </div>
    );
  };

  return (
    <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Client Details (ग्राहक विवरण)</h1>
          <p className="page-subtitle">Viewing details for {client.fullNameEnglish || client.fullNameNepali}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            <div className="detail-item"><strong>Account Number:</strong><br/>{client.accountNumber}</div>
            <div className="detail-item"><strong>Membership ID:</strong><br/>{client.membershipId}</div>
            <div className="detail-item"><strong>Name (English):</strong><br/>{client.fullNameEnglish}</div>
            <div className="detail-item"><strong>पूरा नाम (Nepali):</strong><br/>{client.fullNameNepali}</div>
            <div className="detail-item"><strong>Date of Birth (BS):</strong><br/>{client.dateOfBirth?.bsDate}</div>
            <div className="detail-item"><strong>Membership Date (BS):</strong><br/>{client.dateOfMembership?.bsDate}</div>
            <div className="detail-item"><strong>Status:</strong><br/>
              <span className={`badge ${client.isActive ? 'badge-success' : 'badge-danger'}`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="detail-item"><strong>Email ID:</strong><br/>{client.emailId || '—'}</div>
            <div className="detail-item"><strong>Mobile Number:</strong><br/>{client.mobileNumber}</div>
          </div>
        </div>

        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Identity & Shares</h3>
          </div>
          <div className="form-grid">
            <div className="detail-item"><strong>Citizenship No:</strong><br/>{client.citizenshipNumber}</div>
            <div className="detail-item"><strong>Issue District:</strong><br/>{districts[client.citizenshipIssueDistrict] || client.citizenshipIssueDistrict}</div>
            <div className="detail-item"><strong>Issue Date (BS):</strong><br/>{client.citizenshipIssueDate?.bsDate}</div>
            <div className="detail-item"><strong>Share Amount:</strong><br/>NPR {client.shareAmount}</div>
            <div className="detail-item"><strong>Share Number:</strong><br/>{client.shareNumber}</div>
          </div>
        </div>

        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Family Information (पारिवारिक विवरण)</h3>
          </div>
          <div className="form-grid">
            <div className="detail-item"><strong>Father (English):</strong><br/>{client.fatherNameEnglish}</div>
            <div className="detail-item"><strong>Father (Nepali):</strong><br/>{client.fatherNameNepali}</div>
            <div className="detail-item"><strong>Spouse ({spouseTypes[client.spouseType] || client.spouseType || 'N/A'}):</strong><br/>
              {client.spouseNameEnglish ? `${client.spouseNameEnglish} / ` : ''}{client.spouseNameNepali || '—'}
            </div>
            <div className="detail-item"><strong>Ancestor ({ancestorTypes[client.ancestorType] || client.ancestorType || 'Ancestor'}):</strong><br/>
              {client.ancestorNameEnglish ? `${client.ancestorNameEnglish} / ` : ''}{client.ancestorNameNepali || '—'}
            </div>
          </div>
        </div>
        
        <div className="form-section-card">
          <div className="form-section-header">
            <h3 className="form-section-title">Nominee & Guardian (हकवाला / संरक्षक)</h3>
          </div>
          <div className="form-grid">
            <div className="detail-item"><strong>Nominee (English):</strong><br/>{client.nomineesNameEnglish || '—'}</div>
            <div className="detail-item"><strong>Nominee (Nepali):</strong><br/>{client.nomineesNameNepali || '—'}</div>
            <div className="detail-item"><strong>Nominee Relation ID:</strong><br/>{client.nomineesRelation || '—'}</div>
            <div className="detail-item"><strong>Guardian (English):</strong><br/>{client.guardiansNameEnglish || '—'}</div>
            <div className="detail-item"><strong>Guardian (Nepali):</strong><br/>{client.guardiansNameNepali || '—'}</div>
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
