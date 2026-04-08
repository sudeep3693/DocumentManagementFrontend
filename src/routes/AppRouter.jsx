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
import UserDetailPage from '../pages/UserDetailPage';
import ClientManagement from '../pages/ClientManagement';
import ClientFormPage from '../pages/ClientFormPage';
import ClientDetailsPage from '../pages/ClientDetailsPage';
import UserStatusManagement from '../pages/UserStatusManagement';
import Profile from '../pages/Profile';
import LoanManagement from '../pages/LoanManagement';
import LoanFormPage from '../pages/LoanFormPage';
import LoanDetailsPage from '../pages/LoanDetailsPage';
import RegenerateDocumentPage from '../pages/RegenerateDocumentPage';
import DocumentWriterManagement from '../pages/DocumentWriterManagement';
import NotificationPage from '../pages/NotificationPage';
import AdminNoticeManagement from '../pages/AdminNoticeManagement';
import AdminNoticeForm from '../pages/AdminNoticeForm';
import UserNoticeDetail from '../pages/UserNoticeDetail';

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
          <Route path="/clients/new" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<ClientDetailsPage />} />
          <Route path="/clients/:id/edit" element={<ClientFormPage />} />
          <Route path="/loans" element={<LoanManagement />} />
          <Route path="/loans/new" element={<LoanFormPage />} />
          <Route path="/loans/:id" element={<LoanDetailsPage />} />
          <Route path="/loans/:id/edit" element={<LoanFormPage />} />
          <Route path="/loans/:id/regenerate-tamsuk" element={<RegenerateDocumentPage />} />
          <Route path="/document-writers" element={<DocumentWriterManagement />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/notices/:id" element={<UserNoticeDetail />} />
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
          <Route path="/admin/users/:onboardingSessionId" element={<UserDetailPage />} />
          <Route path="/admin/user-status" element={<UserStatusManagement />} />
          <Route path="/admin/notices" element={<AdminNoticeManagement />} />
          <Route path="/admin/notices/new" element={<AdminNoticeForm />} />
          <Route path="/admin/notices/:id/edit" element={<AdminNoticeForm />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
