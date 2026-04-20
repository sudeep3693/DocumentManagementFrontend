import React, { useState, useEffect } from 'react';
import { getAllDocumentWritersApi } from '../services/api';
import NepaliInput from './NepaliInput';

const DocumentWriterSearchSelect = ({ label, onSelect, error, value, className }) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const fetchWriters = async () => {
      setSearching(true);
      try {
        // Fetch writers. We fetch a decent amount to filter locally, or pass query if backend supports it.
        const res = await getAllDocumentWritersApi({ page: 0, size: 50 });
        const data = res.content || [];
        
        let filtered = data;
        if (query && typeof query === 'string' && query.trim().length > 0) {
           filtered = data.filter(w => 
             w.fullNameNepali?.toLowerCase().includes(query.toLowerCase())
           );
        }
        setResults(filtered);
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    };

    if (showDropdown) {
      const delayDebounceFn = setTimeout(() => {
        fetchWriters();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [query, showDropdown]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
    onSelect({ isNew: true, fullNameNepali: val });
  };

  return (
    <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
      {label && <label>{label}</label>}
      <NepaliInput
        type="text"
        className={className || "form-control"}
        placeholder="Type writer's name (नेपाली)..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => {
          // Delay closing so that click events on dropdown items can register
          setTimeout(() => setShowDropdown(false), 200);
        }}
      />
      {showDropdown && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          listStyle: 'none', padding: 0, margin: '2px 0', maxHeight: '200px', overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {searching ? (
            <li style={{ padding: '0.5rem', color: '#666' }}>Searching...</li>
          ) : results.length > 0 ? (
            results.map(w => (
              <li
                key={w.id}
                style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  // Exact match selected, trigger full autofill
                  onSelect(w);
                  setQuery(w.fullNameNepali);
                  setShowDropdown(false);
                }}
              >
                <strong>{w.fullNameNepali}</strong>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {w.address ? w.address : 'No address'}
                </div>
              </li>
            ))
          ) : (
            <li style={{ padding: '0.5rem', color: '#666' }}>
              No existing writers found. Typing will save as a new writer.
            </li>
          )}
        </ul>
      )}
      {error && <span className="form-error" style={{ display: 'block', marginTop: '0.25rem' }}>{error}</span>}
    </div>
  );
};

export default DocumentWriterSearchSelect;
