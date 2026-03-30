import { useAuth } from '../context/AuthContext';

const PendingApproval = () => {
  const { status, logout } = useAuth();

  return (
    <div className="page-center">
      <div className="status-card">
        {status === 'rejected' ? (
          <>
            <div className="status-icon rejected">✕</div>
            <h2>Account Rejected</h2>
            <p>
              Unfortunately, your account has been rejected by the administrator.
              Please contact support for more information.
            </p>
          </>
        ) : (
          <>
            <div className="status-icon pending">⏳</div>
            <h2>Waiting for Approval</h2>
            <p>
              Your account is pending admin approval. You will gain full access
              once an administrator reviews and approves your account.
            </p>
          </>
        )}
        <button className="btn btn-outline" onClick={async () => {
          await logout();
        }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
