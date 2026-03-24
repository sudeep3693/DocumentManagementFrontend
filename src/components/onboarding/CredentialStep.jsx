import { useState } from 'react';
import PasswordStrengthIndicator, { validatePassword } from '../PasswordStrengthIndicator';

const CredentialStep = ({ onNext, onBack }) => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    repeatPassword: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.password) errs.password = 'Password is required';
    else if (!validatePassword(form.password)) errs.password = 'Password does not meet requirements';
    if (!form.repeatPassword) errs.repeatPassword = 'Please confirm your password';
    else if (form.password !== form.repeatPassword) errs.repeatPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onNext({
      username: form.username.trim(),
      password: form.password,
      repeatPassword: form.repeatPassword,
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create Your Credentials</h3>
      <p className="step-desc">Set up your login username and password</p>
      <div className="form-grid form-grid-1">
        <div className="form-group">
          <label htmlFor="username">Username *</label>
          <input id="username" name="username" value={form.username} onChange={handleChange} placeholder="e.g. john_doe" />
          {errors.username && <span className="form-error">{errors.username}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter password" />
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="repeatPassword">Confirm Password *</label>
          <input id="repeatPassword" name="repeatPassword" type="password" value={form.repeatPassword} onChange={handleChange} placeholder="Repeat password" />
          {errors.repeatPassword && <span className="form-error">{errors.repeatPassword}</span>}
        </div>
        <PasswordStrengthIndicator
          password={form.password}
          confirmPassword={form.repeatPassword}
          showMatch={true}
        />
      </div>
      <div className="step-actions">
        <button type="button" className="btn btn-outline" onClick={onBack}>← Back</button>
        <button type="submit" className="btn btn-primary">Complete Registration</button>
      </div>
    </form>
  );
};

export default CredentialStep;
