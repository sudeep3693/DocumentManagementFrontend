import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, status } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // New user: needs onboarding
  if (role === 'user' && status === 'new') {
    return <Navigate to="/onboarding" replace />;
  }

  // Pending approval
  if (role === 'user' && status === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  // Rejected
  if (role === 'user' && status === 'rejected') {
    return <Navigate to="/pending" replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
