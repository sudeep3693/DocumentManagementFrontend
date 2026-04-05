/**
 * FormSkeleton — Shimmer placeholder for multi-step form pages.
 *
 * Props:
 *   sections  {number}  Number of form section cards (default: 3)
 *   fieldsPerSection {number} Fields per section (default: 6)
 */
const FormSkeleton = ({ sections = 3, fieldsPerSection = 6 }) => {
  return (
    <div className="skeleton-form-wrapper">
      {/* Page header */}
      <div className="skeleton-page-header">
        <div>
          <div className="skeleton-line" style={{ width: '200px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '260px', height: '16px' }} />
        </div>
        <div className="skeleton-line" style={{ width: '120px', height: '38px', borderRadius: '8px' }} />
      </div>

      {/* Step indicator */}
      <div className="skeleton-step-indicator">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div className="skeleton-step-circle" />
            {i < 3 && <div className="skeleton-step-line" />}
          </div>
        ))}
      </div>

      {/* Form sections */}
      {Array.from({ length: sections }).map((_, sIdx) => (
        <div key={sIdx} className="skeleton-card" style={{ marginBottom: '1.25rem' }}>
          {/* Section title */}
          <div className="skeleton-line" style={{ width: '180px', height: '18px', marginBottom: '1.25rem' }} />
          {/* Form grid */}
          <div className="form-grid">
            {Array.from({ length: fieldsPerSection }).map((_, fIdx) => (
              <div key={fIdx} className="form-group" style={{ marginBottom: 0 }}>
                <div className="skeleton-line" style={{ width: '100px', height: '12px', marginBottom: '6px' }} />
                <div className="skeleton-input" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem' }}>
        <div className="skeleton-line" style={{ width: '90px', height: '40px', borderRadius: '8px' }} />
        <div className="skeleton-line" style={{ width: '120px', height: '40px', borderRadius: '8px' }} />
      </div>
    </div>
  );
};

export default FormSkeleton;
