/**
 * NotificationSkeleton — Shimmer placeholder for the notification page.
 */
const NotificationSkeleton = () => {
  return (
    <div className="skeleton-form-wrapper">
      {/* Page header */}
      <div className="skeleton-page-header">
        <div>
          <div className="skeleton-line" style={{ width: '260px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '300px', height: '16px' }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '1.5rem' }}>
        <div className="skeleton-line" style={{ width: '160px', height: '48px', borderRadius: '12px 0 0 0' }} />
        <div className="skeleton-line" style={{ width: '160px', height: '48px', borderRadius: '0 12px 0 0' }} />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
        <div className="skeleton-line" style={{ width: '130px', height: '38px', borderRadius: '20px' }} />
        <div className="skeleton-line" style={{ width: '130px', height: '38px', borderRadius: '20px' }} />
      </div>

      {/* Form card */}
      <div className="skeleton-card">
        {/* Card header */}
        <div className="skeleton-line" style={{ width: '200px', height: '22px', marginBottom: '6px' }} />
        <div className="skeleton-line" style={{ width: '280px', height: '14px', marginBottom: '1.5rem' }} />

        {/* Form grid */}
        <div className="form-grid" style={{ marginBottom: '1rem' }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="form-group" style={{ marginBottom: 0 }}>
              <div className="skeleton-line" style={{ width: '100px', height: '12px', marginBottom: '6px' }} />
              <div className="skeleton-input" />
            </div>
          ))}
        </div>

        {/* Textarea */}
        <div className="form-group">
          <div className="skeleton-line" style={{ width: '80px', height: '12px', marginBottom: '6px' }} />
          <div className="skeleton-line" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
        </div>

        {/* Purpose */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <div className="skeleton-line" style={{ width: '120px', height: '12px', marginBottom: '6px' }} />
          <div className="skeleton-input" />
        </div>

        {/* Variables section */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div className="skeleton-line" style={{ width: '160px', height: '14px' }} />
            <div className="skeleton-line" style={{ width: '110px', height: '32px', borderRadius: '6px' }} />
          </div>
          <div className="skeleton-line" style={{ width: '260px', height: '14px' }} />
        </div>

        {/* Send button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <div className="skeleton-line" style={{ width: '160px', height: '44px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
};

export default NotificationSkeleton;
