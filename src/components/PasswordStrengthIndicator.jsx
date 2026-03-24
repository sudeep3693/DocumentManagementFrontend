import React from 'react';

const CRITERIA = [
  { key: 'minLength', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'uppercase', label: 'At least one uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'At least one lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { key: 'number', label: 'At least one number (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { key: 'special', label: 'At least one special character (!@#$...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export const validatePassword = (password) => {
  return CRITERIA.every(c => c.test(password || ''));
};

const PasswordStrengthIndicator = ({ password = '', confirmPassword, showMatch = false }) => {
  return (
    <div className="password-strength">
      <div className="password-strength-title">Password Requirements</div>
      <div className="password-criteria">
        {CRITERIA.map(c => {
          const met = c.test(password);
          return (
            <div key={c.key} className={`password-criterion ${met ? 'met' : 'unmet'}`}>
              <span className="criterion-icon">{met ? '✓' : '✕'}</span>
              <span>{c.label}</span>
            </div>
          );
        })}
        {showMatch && confirmPassword !== undefined && (
          <div className={`password-criterion ${password && confirmPassword === password ? 'met' : 'unmet'}`}>
            <span className="criterion-icon">{password && confirmPassword === password ? '✓' : '✕'}</span>
            <span>Passwords match</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
