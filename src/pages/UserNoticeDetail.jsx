import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicNoticeByIdApi } from '../services/api';

const UserNoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const data = await getPublicNoticeByIdApi(id);
        setNotice(data);
      } catch (err) {
        console.error('Failed to load notice:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, [id]);

  useEffect(() => {
    if (!notice || !notice.images || notice.images.length <= 1) return;
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % notice.images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [notice, isPaused]);

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <p>Loading Notice...</p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Notice Not Found</h2>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const renderDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `Posted on ${d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  return (
    <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button 
        className="btn btn-sm btn-outline" 
        onClick={() => navigate('/dashboard')} 
        style={{ marginBottom: '1.5rem', gap: '0.35rem' }}
      >
        <span>←</span> Back to Dashboard
      </button>

      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--gray-200)',
        overflow: 'hidden'
      }}>
        {/* Banner / Title Area */}
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
          color: '#fff',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
            {notice.title}
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
            {renderDate(notice.createdDate)}
          </p>
        </div>

        {/* Marquee for Description */}
        <div style={{ 
          background: 'var(--warning-50)', 
          borderBottom: '1px solid var(--warning-200)',
          color: 'var(--warning-700)',
          padding: '0.5rem 0',
          fontSize: '1.05rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center'
        }}>
          {/* using native marquee for simplicity and guaranteed continuous scroll across edge cases */}
          <marquee direction="left" scrollAmount="6" style={{ width: '100%' }}>
            📣 {notice.description}
          </marquee>
        </div>

        <div style={{ padding: '2rem' }}>
          
          {/* Image Carousel */}
          {notice.images && notice.images.length > 0 && (
            <div 
              style={{ position: 'relative', marginBottom: '2rem', background: 'var(--gray-900)', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: '400px' }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {notice.images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img.imageUrl} 
                  alt={img.imageName || 'Notice Image'} 
                  style={{ 
                    position: 'absolute',
                    top: 0, left: 0, 
                    width: '100%', height: '100%', 
                    objectFit: 'contain',
                    opacity: idx === currentImgIndex ? 1 : 0,
                    transition: 'opacity 0.8s ease-in-out',
                    pointerEvents: idx === currentImgIndex ? 'auto' : 'none'
                  }}
                />
              ))}

              {notice.images.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: '0.5rem', zIndex: 10
                }}>
                  {notice.images.map((_, idx) => (
                    <span 
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex(idx);
                      }}
                      style={{ 
                        width: '10px', height: '10px', borderRadius: '50%', cursor: 'pointer',
                        background: idx === currentImgIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                        transition: 'background 0.3s ease'
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Full Description */}
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              Full Details
            </h3>
            <div style={{ whiteSpace: 'pre-line', lineHeight: 1.6, color: 'var(--gray-800)', fontSize: '1.05rem' }}>
              {notice.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNoticeDetail;
