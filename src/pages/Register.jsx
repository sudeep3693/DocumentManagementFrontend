import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { initiateOnboardingApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const [contactNumber, setContactNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    if (!contactNumber.trim()) return 'Contact number is required';
    if (!/^[0-9]{7,10}$/.test(contactNumber.trim())) return 'Contact number must be 7-10 digits';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;

    setLoading(true);
    try {
      const data = await initiateOnboardingApi(contactNumber.trim());

      // Store onboarding session in sessionStorage for use during onboarding
      sessionStorage.setItem('onboardingSession', JSON.stringify({
        onboardingSessionId: data.onboardingSessionId,
        currentStep: data.currentStep,
        companyDetails: data.companyDetails || null,
        contactNumber: contactNumber.trim(),
      }));

      toast.success('Onboarding initiated! Let\'s set up your account.');
      navigate('/onboarding');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to initiate onboarding';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Initiating onboarding..." />;

  return (
    <div className="page-center">
      <div className="auth-card">
        <h2>Register</h2>
        <p className="auth-subtitle">Enter your contact number to get started</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              id="contactNumber"
              type="text"
              value={contactNumber}
              onChange={(e) => { setContactNumber(e.target.value); setError(''); }}
              placeholder="e.g. 9841234567"
              maxLength={10}
            />
            {error && <span className="form-error">{error}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-full">Start Onboarding</button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
