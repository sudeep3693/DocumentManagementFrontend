import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getUserProfileApi, updateUserProfileApi, changeUserPasswordApi } from '../services/api';
import ProfileSkeleton from '../components/skeletons/ProfileSkeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import cache from '../utils/cache';
import PasswordStrengthIndicator, { validatePassword } from '../components/PasswordStrengthIndicator';
import { hasNoNepali } from '../utils/validation';

import CompanyInfoStep from '../components/onboarding/CompanyInfoStep';
import DocumentInfoStep from '../components/onboarding/DocumentInfoStep';
import AddressInfoStep from '../components/onboarding/AddressInfoStep';
import AuthorizedPersonStep from '../components/onboarding/AuthorizedPersonStep';

const EDIT_STEPS = [
  'COMPANY_INFO',
  'COMPANY_DOCUMENT_INFO',
  'ADDRESS_INFO',
  'AUTHORIZED_PERSON_INFO'
];

const VIEW_TAB = 'VIEW';
const EDIT_TAB = 'EDIT';
const PASS_TAB = 'PASSWORD';

const Profile = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(VIEW_TAB);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  // Edit Wizard State
  const [currentEditStep, setCurrentEditStep] = useState(0);
  const [editFormData, setEditFormData] = useState({});

  // Password State
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = cache.get('profile');
      if (cached) {
        setProfileData(cached);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    try {
      const resp = await getUserProfileApi();
      cache.set('profile', resp, 300);
      setProfileData(resp);
    } catch (err) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === EDIT_TAB) {
      setCurrentEditStep(0);
      setEditFormData({
        companyInfoRequestDto: null,
        documentInfoRequestDto: null,
        address: null,
        authorizedPersonRequestDto: null
      });
    }
  };

  // ----- EDIT WIZARD HANDLERS ----- //
  const getPrefill = () => {
    if (!profileData?.companyDetails) return null;
    return {
      ...profileData.companyDetails,
      address: profileData.companyDetails.addressInfo // Map addressInfo to address for AddressInfoStep
    };
  };

  const handleNextStep = async (stepKey, data) => {
    const updatedForm = { ...editFormData };

    if (stepKey === 'COMPANY_INFO') updatedForm.companyInfoRequestDto = data;
    if (stepKey === 'COMPANY_DOCUMENT_INFO') updatedForm.documentInfoRequestDto = data;
    if (stepKey === 'ADDRESS_INFO') updatedForm.address = data;
    if (stepKey === 'AUTHORIZED_PERSON_INFO') updatedForm.authorizedPersonRequestDto = data;

    setEditFormData(updatedForm);

    if (currentEditStep < EDIT_STEPS.length - 1) {
      setCurrentEditStep((prev) => prev + 1);
    } else {
      // Final step submit
      setLoading(true);
      try {
        await updateUserProfileApi(updatedForm);
        toast.success('Profile updated successfully');
        cache.invalidate('profile');
        await loadProfile(true); // reload fresh data
        setActiveTab(VIEW_TAB);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackStep = () => {
    if (currentEditStep > 0) setCurrentEditStep((prev) => prev - 1);
  };

  // ----- PASSWORD HANDLERS ----- //
  const handlePwdChange = (e) => {
    const { name, value } = e.target;
    if (!hasNoNepali(value)) return;
    setPwdForm({ ...pwdForm, [name]: value });
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (!validatePassword(pwdForm.newPassword)) {
      toast.error('Password does not meet requirements');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPwdLoading(true);
    try {
      await changeUserPasswordApi({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
        confirmPassword: pwdForm.confirmPassword
      });
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab(VIEW_TAB);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading && !profileData) {
    return <ProfileSkeleton />;
  }

  const { companyDetails } = profileData || {};

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>User Profile</h1>
          <p className="page-subtitle">Manage your account and view details</p>
        </div>
      </div>

      <div className="tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button className={`btn ${activeTab === VIEW_TAB ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleTabChange(VIEW_TAB)}>
          View Profile
        </button>
        <button className={`btn ${activeTab === EDIT_TAB ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleTabChange(EDIT_TAB)}>
          Edit Profile
        </button>
        <button className={`btn ${activeTab === PASS_TAB ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleTabChange(PASS_TAB)}>
          Change Password
        </button>
      </div>

      {loading && activeTab !== VIEW_TAB && <LoadingSpinner text="Processing..." />}

      {/* ================= VIEW PROFILE ================= */}
      {activeTab === VIEW_TAB && companyDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Cooperative Info */}
          {companyDetails.cooperativeInfo && (
            <div className="card">
              <h3>Cooperative Information</h3>
              <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div><strong>Name (English):</strong> {companyDetails.cooperativeInfo.nameEnglish}</div>
                <div><strong>Name (Nepali):</strong> {companyDetails.cooperativeInfo.nameNepali}</div>
                <div><strong>Registered Office:</strong> {companyDetails.cooperativeInfo.cooperativeRegisteredOffice}</div>
                <div><strong>Email:</strong> {companyDetails.cooperativeInfo.email}</div>
                <div><strong>Contact Number:</strong> {companyDetails.cooperativeInfo.contactNumber}</div>
              </div>
            </div>
          )}

          {/* Address Info */}
          {companyDetails.addressInfo && (
            <div className="card">
              <h3>Address Information</h3>
              <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div><strong>Province ID:</strong> {companyDetails.addressInfo.province}</div>
                <div><strong>District ID:</strong> {companyDetails.addressInfo.district}</div>
                <div><strong>Municipality ID:</strong> {companyDetails.addressInfo.municipality}</div>
                <div><strong>Ward No:</strong> {companyDetails.addressInfo.wardNo}</div>
                <div><strong>Tole:</strong> {companyDetails.addressInfo.tole}</div>
                {companyDetails.addressInfo.houseNo && <div><strong>House No:</strong> {companyDetails.addressInfo.houseNo}</div>}
              </div>
            </div>
          )}

          {/* Authorized Person */}
          {companyDetails.authorizedPersonInfo && (
            <div className="card">
              <h3>Authorized Person Info</h3>
              <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div><strong>Full Name:</strong> {companyDetails.authorizedPersonInfo.fullName}</div>
                <div><strong>Contact No:</strong> {companyDetails.authorizedPersonInfo.contactNo}</div>
                <div><strong>Email:</strong> {companyDetails.authorizedPersonInfo.emailAddress}</div>
                <div><strong>Citizenship No:</strong> {companyDetails.authorizedPersonInfo.citizenshipNo}</div>
                <div><strong>Issued Date (BS):</strong> {companyDetails.authorizedPersonInfo.citizenshipIssuedDate?.bsDate}</div>
              </div>
            </div>
          )}

          {/* Documents */}
          {companyDetails.documentInfo && companyDetails.documentInfo.length > 0 && (
            <div className="card">
              <h3>Documents</h3>
              <ul style={{ marginTop: '1rem' }}>
                {companyDetails.documentInfo.map((doc, i) => (
                  <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                    <strong>Type ID:</strong> {doc.documentType} | <strong>Num:</strong> {doc.documentNumber} | <strong>Issued (BS):</strong> {doc.documentIssueDate?.bsDate}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ================= EDIT PROFILE ================= */}
      {activeTab === EDIT_TAB && (
        <div className="card" style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Edit Step {currentEditStep + 1} of {EDIT_STEPS.length}</h2>
          </div>
          
          {EDIT_STEPS[currentEditStep] === 'COMPANY_INFO' && (
            <CompanyInfoStep
              data={{ contactNumber: user?.contactNumber }} 
              prefill={getPrefill()}
              formData={editFormData}
              isEditMode={true}
              onNext={(data) => handleNextStep('COMPANY_INFO', data)}
            />
          )}

          {EDIT_STEPS[currentEditStep] === 'COMPANY_DOCUMENT_INFO' && (
            <DocumentInfoStep
              prefill={getPrefill()}
              formData={editFormData}
              onNext={(data) => handleNextStep('COMPANY_DOCUMENT_INFO', data)}
              onBack={handleBackStep}
            />
          )}

          {EDIT_STEPS[currentEditStep] === 'ADDRESS_INFO' && (
            <AddressInfoStep
              prefill={getPrefill()}
              formData={editFormData}
              onNext={(data) => handleNextStep('ADDRESS_INFO', data)}
              onBack={handleBackStep}
            />
          )}

          {EDIT_STEPS[currentEditStep] === 'AUTHORIZED_PERSON_INFO' && (
            <AuthorizedPersonStep
              prefill={getPrefill()}
              formData={editFormData}
              onNext={(data) => handleNextStep('AUTHORIZED_PERSON_INFO', data)}
              onBack={handleBackStep}
            />
          )}
        </div>
      )}

      {/* ================= CHANGE PASSWORD ================= */}
      {activeTab === PASS_TAB && (
        <div className="card" style={{ maxWidth: '500px' }}>
          <h3>Change Password</h3>
          <form onSubmit={handlePwdSubmit} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Current Password *</label>
              <input type="password" name="currentPassword" value={pwdForm.currentPassword} onChange={handlePwdChange} />
            </div>
            <div className="form-group">
              <label>New Password *</label>
              <input type="password" name="newPassword" value={pwdForm.newPassword} onChange={handlePwdChange} />
            </div>
            <div className="form-group">
              <label>Confirm New Password *</label>
              <input type="password" name="confirmPassword" value={pwdForm.confirmPassword} onChange={handlePwdChange} />
            </div>
            <PasswordStrengthIndicator
              password={pwdForm.newPassword}
              confirmPassword={pwdForm.confirmPassword}
              showMatch={true}
            />
            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                {pwdLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
