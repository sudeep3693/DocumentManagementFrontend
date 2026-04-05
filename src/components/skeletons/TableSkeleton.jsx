/**
 * TableSkeleton — Shimmer placeholder for paginated list/table pages.
 *
 * Props:
 *   rows    {number}  Number of body rows to show (default: 5)
 *   cols    {number}  Number of columns (default: 5)
 *   hasActions {bool} If true, last column renders a "buttons" shimmer (default: true)
 */
const TableSkeleton = ({ rows = 5, cols = 5, hasActions = true }) => {
  const dataColCount = hasActions ? cols - 1 : cols;

  return (
    <div className="skeleton-table-wrapper">
      {/* Fake page header */}
      <div className="skeleton-page-header">
        <div>
          <div className="skeleton-line" style={{ width: '220px', height: '28px', marginBottom: '8px' }} />
          <div className="skeleton-line" style={{ width: '160px', height: '16px' }} />
        </div>
        <div className="skeleton-line" style={{ width: '120px', height: '38px', borderRadius: '8px' }} />
      </div>

      {/* Fake card with table */}
      <div className="skeleton-card">
        <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              {Array.from({ length: dataColCount }).map((_, i) => (
                <th key={i}>
                  <div className="skeleton-line" style={{ width: `${60 + (i % 3) * 20}px`, height: '12px' }} />
                </th>
              ))}
              {hasActions && (
                <th style={{ width: '140px' }}>
                  <div className="skeleton-line" style={{ width: '60px', height: '12px' }} />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: dataColCount }).map((_, colIdx) => (
                  <td key={colIdx}>
                    <div
                      className="skeleton-line"
                      style={{
                        width: `${55 + ((rowIdx + colIdx) % 4) * 15}%`,
                        height: '14px',
                      }}
                    />
                  </td>
                ))}
                {hasActions && (
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div className="skeleton-btn" />
                      <div className="skeleton-btn" />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableSkeleton;
