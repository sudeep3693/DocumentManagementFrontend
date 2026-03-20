import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAdminUserDetailsApi, acceptRejectUserApi, getRolesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const UserDetailPage = () => {
  const { onboardingSessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [message, setMessage] = useState('');
  const [activeUntil, setActiveUntil] = useState('');
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detailsData, rolesData] = await Promise.all([
          getAdminUserDetailsApi(onboardingSessionId),
          getRolesApi(),
        ]);
        setDetails(detailsData);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch {
        toast.error('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [onboardingSessionId]);

  const handleAcceptReject = async (status) => {
    if (status === 'ACCEPTED' && selectedRoles.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    setSubmitting(true);
    try {
      await acceptRejectUserApi({
        companyInfoId: details?.companyInfoId || details?.companyDetails?.companyInfoId || 0,
        roles: selectedRoles,
        activeUntil: activeUntil ? new Date(activeUntil + 'T12:00:00').toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status,
        acceptedBy: currentUser?.username || 'admin',
        message,
      });
      toast.success(`User ${status === 'ACCEPTED' ? 'accepted' : 'rejected'} successfully`);
      navigate('/admin/users');
    } catch {
      toast.error(`Failed to ${status === 'ACCEPTED' ? 'accept' : 'reject'} user`);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!details) {
    return (
      <div className="page-content">
        <div className="empty-state-card">
          <h3>User Not Found</h3>
          <p>Could not load details for this user.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>← Back to Users</button>
        </div>
      </div>
    );
  }

  const { companyDetails } = details;
  const coop = companyDetails?.cooperativeInfo || {};
  const docs = companyDetails?.documentInfo || [];
  const addr = companyDetails?.addressInfo || {};
  const person = companyDetails?.authorizedPersonInfo || {};

  return (
    <div className="page-content">
      <div className="detail-page-header">
        <button className="btn btn-outline" onClick={() => navigate('/admin/users')}>← Back to Users</button>
        <h1>User Details</h1>
        <div className="detail-meta">
          <span className={`badge badge-${details.currentStep === 'COMPLETED' ? 'success' : 'warning'}`}>
            Step: {details.currentStep}
          </span>
        </div>
      </div>

      {/* Cooperative Information */}
      <div className="detail-section">
        <div className="detail-section-header">
          <span className="section-icon">🏢</span>
          <h3>Cooperative Information</h3>
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Name (English)</label>
            <span>{coop.nameEnglish || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Name (Nepali)</label>
            <span>{coop.nameNepali || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Type</label>
            <span>{coop.cooperativeType || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Registered Office</label>
            <span>{coop.cooperativeRegisteredOffice || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Email</label>
            <span>{coop.email || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Contact</label>
            <span>{coop.contactNumber || '—'}</span>
          </div>
        </div>
      </div>

      {/* Documents */}
      {docs.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-header">
            <span className="section-icon">📄</span>
            <h3>Documents</h3>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Number</th>
                  <th>Issue Date</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, i) => (
                  <tr key={i}>
                    <td>{doc.documentType}</td>
                    <td>{doc.documentNumber || '—'}</td>
                    <td>{doc.documentIssueDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Address */}
      <div className="detail-section">
        <div className="detail-section-header">
          <span className="section-icon">📍</span>
          <h3>Address Information</h3>
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Province</label>
            <span>{addr.province || '—'}</span>
          </div>
          <div className="detail-item">
            <label>District</label>
            <span>{addr.district || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Municipality</label>
            <span>{addr.municipality || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Tole</label>
            <span>{addr.tole || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Ward No</label>
            <span>{addr.wardNo || '—'}</span>
          </div>
          <div className="detail-item">
            <label>House No</label>
            <span>{addr.houseNo || '—'}</span>
          </div>
        </div>
      </div>

      {/* Authorized Person */}
      <div className="detail-section">
        <div className="detail-section-header">
          <span className="section-icon">👤</span>
          <h3>Authorized Person</h3>
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Full Name (English)</label>
            <span>{person.fullName || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Full Name (Nepali)</label>
            <span>{person.fullNameNepali || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Contact</label>
            <span>{person.contactNo || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Email</label>
            <span>{person.emailAddress || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Citizenship No</label>
            <span>{person.citizenshipNo || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Citizenship Issued District</label>
            <span>{person.citizenshipIssuedDistrict || '—'}</span>
          </div>
          <div className="detail-item">
            <label>Citizenship Issued Date</label>
            <span>{person.citizenshipIssuedDate || '—'}</span>
          </div>
        </div>
      </div>

      {/* Accept / Reject Form */}
      {location.state?.status === 'p' && (
      <div className="detail-section action-section">
        <div className="detail-section-header">
          <span className="section-icon">⚡</span>
          <h3>Take Action</h3>
        </div>

        <div className="action-form">
          {/* Role Multi-Select */}
          <div className="form-group">
            <label>Assign Roles *</label>
            <div className="multi-select-container">
              <div
                className="multi-select-trigger"
                onClick={() => setShowRolesDropdown(!showRolesDropdown)}
              >
                {selectedRoles.length === 0 ? (
                  <span className="placeholder-text">Select roles...</span>
                ) : (
                  <div className="selected-tags">
                    {selectedRoles.map((role) => (
                      <span key={role} className="role-tag">
                        {role}
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRole(role);
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <span className="dropdown-arrow">{showRolesDropdown ? '▲' : '▼'}</span>
              </div>
              {showRolesDropdown && (
                <div className="multi-select-dropdown">
                  {roles.length === 0 ? (
                    <div className="dropdown-empty">No roles available</div>
                  ) : (
                    roles.map((role) => {
                      const roleName = typeof role === 'string' ? role : role.name || role.roleName || '';
                      return (
                        <label key={roleName} className="dropdown-option">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(roleName)}
                            onChange={() => toggleRole(roleName)}
                          />
                          <span>{roleName}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Until */}
          <div className="form-group">
            <label>Active Until</label>
            <input
              type="date"
              value={activeUntil}
              onChange={(e) => setActiveUntil(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Message */}
          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message for this action..."
              rows={3}
              className="form-input"
            />
          </div>

          {/* Accepted By (auto-filled) */}
          <div className="form-group">
            <label>Action By</label>
            <input
              type="text"
              value={currentUser?.username || 'admin'}
              disabled
              className="form-input disabled"
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn btn-success btn-lg"
              onClick={() => handleAcceptReject('ACCEPTED')}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : '✅ Accept User'}
            </button>
            <button
              className="btn btn-danger btn-lg"
              onClick={() => handleAcceptReject('REJECTED')}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : '❌ Reject User'}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default UserDetailPage;
