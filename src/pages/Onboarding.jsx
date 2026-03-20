import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { submitOnboardingApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StepIndicator from '../components/onboarding/StepIndicator';
import CompanyInfoStep from '../components/onboarding/CompanyInfoStep';
import DocumentInfoStep from '../components/onboarding/DocumentInfoStep';
import AddressInfoStep from '../components/onboarding/AddressInfoStep';
import AuthorizedPersonStep from '../components/onboarding/AuthorizedPersonStep';
import CredentialStep from '../components/onboarding/CredentialStep';

const STEP_ORDER = [
  'COMPANY_INFO',
  'COMPANY_DOCUMENT_INFO',
  'ADDRESS_INFO',
  'AUTHORIZED_PERSON_INFO',
  'COMPLETED',
];

const Onboarding = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState('COMPANY_INFO');

  // Accumulated form data across steps
  const [formData, setFormData] = useState({
    contactNumber: '',
    companyInfoRequestDto: null,
    documentInfoRequestDto: null,
    address: null,
    authorizedPersonRequestDto: null,
    credential: null,
  });

  const getFrontendStep = (backendStep) => {
    if (backendStep === 'STARTED') return 'COMPANY_INFO';
    const idx = STEP_ORDER.indexOf(backendStep);
    if (idx !== -1 && idx < STEP_ORDER.length - 1) {
      return STEP_ORDER[idx + 1];
    }
    if (backendStep === 'COMPLETED') return 'COMPLETED';
    return null;
  };

  useEffect(() => {
    // Load session from sessionStorage (set by Register page)
    try {
      const stored = JSON.parse(sessionStorage.getItem('onboardingSession'));
      if (stored) {
        setSession(stored);
        setFormData((prev) => ({ ...prev, contactNumber: stored.contactNumber }));

        // Map the backend step to our step order
        const step = getFrontendStep(stored.currentStep) || 'COMPANY_INFO';
        setCurrentStep(step);
      } else {
        // No session — redirect to register
        navigate('/register');
      }
    } catch {
      navigate('/register');
    }
  }, [navigate]);

  const getCurrentStepIndex = () => STEP_ORDER.indexOf(currentStep);

  const goBack = () => {
    const idx = getCurrentStepIndex();
    if (idx > 0) {
      setCurrentStep(STEP_ORDER[idx - 1]);
    }
  };

  const submitToBackend = async (updatedData) => {
    setLoading(true);
    try {
      const payload = {
        onboardingSessionId: session?.onboardingSessionId,
        companyInfoRequestDto: updatedData.companyInfoRequestDto || null,
        documentInfoRequestDto: updatedData.documentInfoRequestDto || null,
        address: updatedData.address || null,
        authorizedPersonRequestDto: updatedData.authorizedPersonRequestDto || null,
        credential: updatedData.credential || null,
      };

      const response = await submitOnboardingApi(payload);

      // Update session with new step
      const newStep = response.currentStep;
      const updatedSession = { ...session, currentStep: newStep, companyDetails: response.companyDetails };
      sessionStorage.setItem('onboardingSession', JSON.stringify(updatedSession));
      setSession(updatedSession);

      return response;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Submission failed';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyInfoNext = async (companyInfo) => {
    const updated = {
      ...formData,
      companyInfoRequestDto: companyInfo,
    };
    setFormData(updated);

    try {
      const response = await submitToBackend(updated);
      setCurrentStep(getFrontendStep(response.currentStep) || 'COMPANY_DOCUMENT_INFO');
      toast.success('Company info saved!');
    } catch {
      // Error already shown by submitToBackend
    }
  };

  const handleDocumentInfoNext = async (documents) => {
    const updated = {
      ...formData,
      documentInfoRequestDto: documents,
    };
    setFormData(updated);

    try {
      const response = await submitToBackend(updated);
      setCurrentStep(getFrontendStep(response.currentStep) || 'ADDRESS_INFO');
      toast.success('Documents saved!');
    } catch {
      // Error already shown
    }
  };

  const handleAddressNext = async (address) => {
    const updated = { ...formData, address };
    setFormData(updated);

    try {
      const response = await submitToBackend(updated);
      setCurrentStep(getFrontendStep(response.currentStep) || 'AUTHORIZED_PERSON_INFO');
      toast.success('Address saved!');
    } catch {
      // Error already shown
    }
  };

  const handleAuthorizedPersonNext = async (authorizedPerson) => {
    const updated = { ...formData, authorizedPersonRequestDto: authorizedPerson };
    setFormData(updated);

    try {
      const response = await submitToBackend(updated);
      setCurrentStep(getFrontendStep(response.currentStep) || 'COMPLETED');
      toast.success('Authorized person saved!');
    } catch {
      // Error already shown
    }
  };

  const handleCredentialNext = async (credential) => {
    const updated = { ...formData, credential };
    setFormData(updated);

    try {
      await submitToBackend(updated);
      toast.success('Registration completed! Please login with your credentials.');
      sessionStorage.removeItem('onboardingSession');
      navigate('/login');
    } catch {
      // Error already shown
    }
  };

  if (!session) return <LoadingSpinner text="Loading..." />;
  if (loading) return <LoadingSpinner text="Saving..." />;

  const prefill = session?.companyDetails || null;

  return (
    <div className="page-center">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h2>📄 Account Setup</h2>
          <p className="auth-subtitle">Complete the following steps to set up your account</p>
        </div>

        <StepIndicator currentStep={currentStep} />

        <div className="onboarding-form-area">
          {currentStep === 'COMPANY_INFO' && (
            <CompanyInfoStep
              data={{ contactNumber: formData.contactNumber }}
              prefill={prefill}
              formData={formData}
              onNext={handleCompanyInfoNext}
            />
          )}

          {currentStep === 'COMPANY_DOCUMENT_INFO' && (
            <DocumentInfoStep
              prefill={prefill}
              formData={formData}
              onNext={handleDocumentInfoNext}
              onBack={goBack}
            />
          )}

          {currentStep === 'ADDRESS_INFO' && (
            <AddressInfoStep
              prefill={prefill}
              formData={formData}
              onNext={handleAddressNext}
              onBack={goBack}
            />
          )}

          {currentStep === 'AUTHORIZED_PERSON_INFO' && (
            <AuthorizedPersonStep
              prefill={prefill}
              formData={formData}
              onNext={handleAuthorizedPersonNext}
              onBack={goBack}
            />
          )}

          {currentStep === 'COMPLETED' && (
            <CredentialStep
              onNext={handleCredentialNext}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
