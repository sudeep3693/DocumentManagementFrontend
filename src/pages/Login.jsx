import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success('Login successful!');
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
      const message = err.response?.data?.message || err.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  if (loading) return <LoadingSpinner text="Signing in..." />;

  return (
    <div className="page-center">
      <div className="auth-card">
        <h2>Login</h2>
        <p className="auth-subtitle">Welcome back to DocMan</p>
        <form onSubmit={handleSubmit}>
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
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
