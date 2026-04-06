import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // OTP Flow state
  const [otpStep, setOtpStep] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(0);

  const { login, validateOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Timer countdown hook
  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timerId);
    } else if (timeLeft === 0 && otpStep) {
      // Allow user to see it expired, they can click "Go back to login" or we could auto reset
    }
  }, [timeLeft, otpStep]);

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const response = await login(form.username, form.password);
      
      setSessionId(response.sessionId);
      setTimeLeft(response.expiryMinutes * 60); // minutes to seconds
      setOtpStep(true);
      
      toast.success(response.message || 'OTP sent successfully');
      
      // Attempt to auto-focus first OTP input after transition
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const currentOtp = otpValues.join('');
    if (currentOtp.length < 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    if (timeLeft === 0) {
      toast.error('OTP has expired. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const user = await validateOtp(sessionId, currentOtp);
      toast.success('Login successful!');
      // Navigate based on user status and role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.status === 'new' || user.status === 'STARTED') {
        navigate('/onboarding');
      } else if (user.status === 'pending' || user.status === 'rejected') {
        navigate('/pending');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'OTP validation failed';
      toast.error(message);
      // Reset boxes on verification failure
      setOtpValues(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleOtpChange = (index, value) => {
    // allow only numbers
    if (value && !/^[0-9]+$/.test(value)) return;

    const newOtpValues = [...otpValues];
    
    // Support pasting a multi-character string
    if (value.length > 1) {
      const chars = value.split('').slice(0, 6);
      chars.forEach((char, i) => {
        if (index + i < 6) newOtpValues[index + i] = char;
      });
      setOtpValues(newOtpValues);
      
      // Focus on the next empty box or the last box
      const nextEmptyIndex = newOtpValues.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      otpRefs.current[focusIndex]?.focus();
      return;
    }

    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otpValues[index] === '' && index > 0) {
        // Move focus backward if current is empty
        otpRefs.current[index - 1]?.focus();
      } else {
        // Clear current input value
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return <LoadingSpinner text={otpStep ? "Validating OTP..." : "Signing in..."} />;

  return (
    <div className="page-center">
      <div className="auth-card" style={{ transition: 'all 0.3s ease-in-out' }}>
        <h2>{otpStep ? 'Verify OTP' : 'Login'}</h2>
        <p className="auth-subtitle">
          {otpStep ? 'Enter the 6-digit code sent to your contact number' : 'Welcome back to DocMan'}
        </p>
        
        {!otpStep ? (
          <form onSubmit={handleLoginSubmit} className="animate-fade-in">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
              />
              {errors.username && <span className="form-error">{errors.username}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-full">Login</button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="otp-form animate-fade-in">
            <div className="otp-container" style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '25px 0' }}>
              {otpValues.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6} // Supports pasting up to 6 characters
                  value={digit}
                  ref={(el) => (otpRefs.current[index] = el)}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  disabled={timeLeft === 0}
                  className="otp-input"
                  style={{
                    width: '45px',
                    height: '55px',
                    fontSize: '24px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                    backgroundColor: timeLeft === 0 ? '#f5f5f5' : '#fff',
                    color: '#333'
                  }}
                  onFocus={(e) => { 
                    if (timeLeft > 0) {
                      e.target.style.borderColor = '#0066cc'; 
                      e.target.style.boxShadow = '0 0 5px rgba(0, 102, 204, 0.3)';
                    }
                  }}
                  onBlur={(e) => { 
                    e.target.style.borderColor = '#e0e0e0'; 
                    e.target.style.boxShadow = 'none'; 
                  }}
                />
              ))}
            </div>

            <div className="timer-container" style={{ 
              textAlign: 'center', 
              marginBottom: '25px', 
              color: timeLeft <= 60 ? '#d32f2f' : '#333',
              fontSize: '15px'
            }}>
              <span style={{ fontWeight: '500' }}>
                {timeLeft > 0 ? `Time remaining: ${formatTime(timeLeft)}` : 'OTP has expired'}
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={timeLeft === 0}>
              Verify OTP
            </button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setOtpStep(false);
                  setSessionId('');
                  setOtpValues(['', '', '', '', '', '']);
                  setTimeLeft(0);
                }}
                style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  textDecoration: 'underline' 
                }}
              >
                Go back to login
              </button>
            </div>
          </form>
        )}

        {!otpStep && (
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
