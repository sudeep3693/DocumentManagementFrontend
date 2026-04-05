/**
 * ProfileSkeleton — Shimmer placeholder for the Profile page.
 * Shows 3 info cards with multiple label+value fields each.
 */
const ProfileSkeleton = () => {
  const cards = [
    { title: 200, fields: 5 },
    { title: 160, fields: 4 },
    { title: 170, fields: 5 },
    { title: 150, fields: 3 },
  ];

  return (
    <div className="skeleton-profile-wrapper">
      {/* Page header */}
      <div className="skeleton-page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="skeleton-line" style={{ width: '160px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '240px', height: '16px' }} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
        {[100, 90, 120].map((w, i) => (
          <div key={i} className="skeleton-line" style={{ width: `${w}px`, height: '38px', borderRadius: '8px' }} />
        ))}
      </div>

      {/* Info cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {cards.map((card, cIdx) => (
          <div key={cIdx} className="skeleton-card">
            <div className="skeleton-line" style={{ width: `${card.title}px`, height: '20px', marginBottom: '1.25rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {Array.from({ length: card.fields }).map((_, fIdx) => (
                <div key={fIdx}>
                  <div className="skeleton-line" style={{ width: '110px', height: '12px', marginBottom: '6px' }} />
                  <div className="skeleton-line" style={{ width: `${50 + (fIdx % 4) * 12}%`, height: '16px' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileSkeleton;
