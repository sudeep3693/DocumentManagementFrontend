import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Onboarding from '../pages/Onboarding';
import PendingApproval from '../pages/PendingApproval';
import UserDashboard from '../pages/UserDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import UserManagement from '../pages/UserManagement';
import ClientManagement from '../pages/ClientManagement';
import Profile from '../pages/Profile';

const AuthRedirect = ({ children }) => {
  const { isAuthenticated, role, status } = useAuth();
  if (isAuthenticated) {
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (status === 'new' || status === 'STARTED') return <Navigate to="/onboarding" replace />;
    if (status === 'pending' || status === 'rejected') return <Navigate to="/pending" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<AuthRedirect><Home /></AuthRedirect>} />
        <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
        <Route path="/register" element={<Register />} />

        {/* Onboarding — step-by-step wizard (no auth required) */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/pending" element={<PendingApproval />} />

        {/* Protected user routes */}
        <Route element={
          <ProtectedRoute allowedRoles={['user']}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Protected admin routes */}
        <Route element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
