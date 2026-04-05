/**
 * DetailSkeleton — Shimmer placeholder for detail/view pages.
 *
 * Props:
 *   cards     {number}  Number of section cards to render (default: 4)
 *   itemsPerCard {number} Number of field rows in each card (default: 6)
 */
const DetailSkeleton = ({ cards = 4, itemsPerCard = 6 }) => {
  return (
    <div className="skeleton-detail-wrapper" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Page header */}
      <div className="skeleton-page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="skeleton-line" style={{ width: '240px', height: '30px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '180px', height: '16px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="skeleton-line" style={{ width: '80px', height: '38px', borderRadius: '8px' }} />
          <div className="skeleton-line" style={{ width: '110px', height: '38px', borderRadius: '8px' }} />
        </div>
      </div>

      {/* Section cards */}
      <div className="client-form-container">
        {Array.from({ length: cards }).map((_, cardIdx) => (
          <div key={cardIdx} className="skeleton-card" style={{ marginBottom: '1.25rem' }}>
            {/* Card header */}
            <div className="skeleton-line" style={{ width: '200px', height: '18px', marginBottom: '1.25rem' }} />
            {/* Grid of items */}
            <div className="form-grid">
              {Array.from({ length: itemsPerCard }).map((_, itemIdx) => (
                <div key={itemIdx} className="detail-item">
                  <div className="skeleton-line" style={{ width: '120px', height: '12px', marginBottom: '6px' }} />
                  <div className="skeleton-line" style={{ width: `${55 + (itemIdx % 3) * 15}%`, height: '16px' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailSkeleton;
