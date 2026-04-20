import React, { useState, useEffect } from 'react';
import { processNepaliFieldInput, finalizeNepaliFieldInput } from '../utils/transliteration';

const NepaliInput = ({ value, onChange, name, onBlur, ...rest }) => {
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const processed = processNepaliFieldInput(rawVal);
    
    setInternalValue(processed);
    
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          name: name || e.target.name,
          value: processed
        }
      });
    }
  };

  const handleBlur = (e) => {
    const rawVal = e.target.value;
    const finalized = finalizeNepaliFieldInput(rawVal);
    
    if (finalized !== rawVal) {
      setInternalValue(finalized);
      if (onChange) {
        onChange({
          ...e,
          target: {
            ...e.target,
            name: name || e.target.name,
            value: finalized
          }
        });
      }
    }
    
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      name={name}
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      {...rest}
    />
  );
};

export default NepaliInput;
