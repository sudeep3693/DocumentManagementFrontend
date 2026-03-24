import React, { useCallback, useRef, useEffect } from 'react';
import NepaliDatePicker from '@sbmdkl/nepali-datepicker-reactjs';
import '@sbmdkl/nepali-datepicker-reactjs/dist/index.css';

// Convert Nepali digits (०-९) to English digits (0-9)
const nepaliToEnglishDigits = (str) => {
  if (!str || typeof str !== 'string') return str;
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return str.replace(/[०-९]/g, (ch) => nepaliDigits.indexOf(ch).toString());
};

// Normalize the value: extract bsDate from object, convert Nepali digits to English
const normalizeValue = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value.bsDate) {
    return nepaliToEnglishDigits(value.bsDate);
  }
  if (typeof value === 'string') {
    return nepaliToEnglishDigits(value);
  }
  return '';
};

const NepaliDatePickerWrapper = ({ name, value, onChange, className }) => {
  const normalizedValue = normalizeValue(value);
  const isInitialMount = useRef(true);
  const hasExternalValue = normalizedValue && normalizedValue.length > 0;

  const handleDateChange = useCallback(({ bsDate, adDate }) => {
    // On initial mount with an external value, the library fires onChange with today's date.
    // We suppress that and keep the external value.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (hasExternalValue) {
        // Don't let the library overwrite the external value with today's date
        return;
      }
    }
    onChange({ target: { name, value: { bsDate, adDate } } });
  }, [name, onChange, hasExternalValue]);

  // Reset the mount flag when key changes
  useEffect(() => {
    isInitialMount.current = true;
  }, [normalizedValue]);

  return (
    <div className="nepali-datepicker-wrapper">
      <div className="nepali-datepicker-input-container">
        <span className="nepali-datepicker-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <NepaliDatePicker
          key={normalizedValue || 'empty'}
          className={`nepali-datepicker-input ${className || 'form-control'}`}
          defaultDate={normalizedValue || ''}
          hideDefaultValue={!hasExternalValue}
          onChange={handleDateChange}
          options={{ calenderLocale: 'ne', valueLocale: 'en' }}
        />
      </div>
    </div>
  );
};

export default NepaliDatePickerWrapper;
