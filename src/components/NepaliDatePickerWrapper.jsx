import React from 'react';
import NepaliDatePicker from '@sbmdkl/nepali-datepicker-reactjs';
import '@sbmdkl/nepali-datepicker-reactjs/dist/index.css';

const NepaliDatePickerWrapper = ({ name, value, onChange, className }) => {
  const handleDateChange = (date) => {
    onChange({ target: { name, value: date } });
  };

  return (
    <div style={{ width: '100%' }}>
      <NepaliDatePicker
        inputClassName={className || 'form-control'}
        value={value || ''}
        onChange={handleDateChange}
        options={{ calenderLocale: 'ne', valueLocale: 'en' }}
      />
    </div>
  );
};

export default NepaliDatePickerWrapper;
