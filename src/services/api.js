import axiosInstance from './axiosInstance';
import {
  getUsers,
  updateUser,
} from './mockData';

// Simulate async API delay for mock endpoints
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// ==================== AUTH SERVICES (Real Backend) ====================

export const loginApi = async (username, password) => {
  const response = await axiosInstance.post('/api/v1/auth/login', { username, password });
  return response.data;
};

export const refreshTokenApi = async (refreshToken) => {
  const response = await axiosInstance.post('/api/v1/auth/refresh', { refreshToken });
  return response.data;
};

export const logoutApi = async () => {
  const response = await axiosInstance.post('/api/v1/auth/logout');
  return response.data;
};

// ==================== ADMIN USER MANAGEMENT (Real Backend) ====================

export const getAdminUsersApi = async (status) => {
  const response = await axiosInstance.get(`/api/v1/admin/users/by-status`, {
    params: status ? { status } : {},
  });
  return response.data;
};

export const getAdminUserDetailsApi = async (onboardingSessionId) => {
  const response = await axiosInstance.get(`/api/v1/admin/users/details/${onboardingSessionId}`);
  return response.data;
};

export const acceptRejectUserApi = async (data) => {
  const response = await axiosInstance.post('/api/v1/admin/users/accept', data);
  return response.data;
};

export const getRolesApi = async () => {
  const response = await axiosInstance.get('/api/v1/admin/roles');
  return response.data;
};

// ==================== ADMIN USER STATUS MANAGEMENT (Real Backend) ====================

export const getAdminAllUsersApi = async () => {
  const response = await axiosInstance.get('/api/v1/admin/users');
  return response.data;
};

export const getAdminPublishedUsersApi = async (status) => {
  const response = await axiosInstance.get('/api/v1/admin/users/published', {
    params: { status },
  });
  return response.data;
};

export const updateUserStatusApi = async (data) => {
  const response = await axiosInstance.put('/api/v1/admin/users/status', data);
  return response.data;
};

export const getAdminUserByIdApi = async (userId) => {
  const response = await axiosInstance.get(`/api/v1/admin/users/${userId}`);
  return response.data;
};

// ==================== ONBOARDING SERVICES (Real Backend) ====================

export const initiateOnboardingApi = async (contactNumber) => {
  const response = await axiosInstance.post('/api/v1/users/onboarding/initiate', { contactNumber });
  return response.data;
};

export const submitOnboardingApi = async (data) => {
  const response = await axiosInstance.post('/api/v1/users/onboarding/proceed', data);
  return response.data;
};

export const getCodeValuesApi = async (codeId, parentId) => {
  const params = { codeId };
  if (parentId) params.parentId = parentId;
  const response = await axiosInstance.get('/api/v1/codevalues', { params });
  return response.data;
};

// ==================== USER MANAGEMENT (Mock — Admin) ====================

export const getUsersApi = async () => {
  await delay();
  return getUsers()
    .filter((u) => u.role !== 'admin')
    .map(({ password, ...u }) => u);
};

export const approveUserApi = async (userId) => {
  await delay();
  const updated = updateUser(userId, { status: 'approved' });
  if (!updated) throw new Error('User not found');
  const { password: _, ...userData } = updated;
  return userData;
};

export const rejectUserApi = async (userId) => {
  await delay();
  const updated = updateUser(userId, { status: 'rejected' });
  if (!updated) throw new Error('User not found');
  const { password: _, ...userData } = updated;
  return userData;
};

// ==================== CLIENT SERVICES (Real Backend) ====================

export const getClientsApi = async (params) => {
  const response = await axiosInstance.get('/api/v1/clients', { params });
  return response.data;
};

export const bulkImportClientsApi = async (formData) => {
  const response = await axiosInstance.post('/api/v1/clients/bulk/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getClientByIdApi = async (clientId) => {
  const response = await axiosInstance.get(`/api/v1/clients/${clientId}`);
  return response.data;
};

export const addClientApi = async (clientData) => {
  const response = await axiosInstance.post('/api/v1/clients', clientData);
  return response.data;
};

export const updateClientApi = async (clientId, clientData) => {
  const response = await axiosInstance.put(`/api/v1/clients/${clientId}`, clientData);
  return response.data;
};

export const deleteClientApi = async (clientId) => {
  const response = await axiosInstance.delete(`/api/v1/clients/${clientId}`);
  return response.data;
};

export const searchClientsApi = async (params) => {
  const response = await axiosInstance.get('/api/v1/clients/search', { params });
  return response.data;
};

export const getDeletedClientsApi = async (params) => {
  const response = await axiosInstance.get('/api/v1/clients/deleted', { params });
  return response.data;
};

export const enableClientApi = async (clientId) => {
  const response = await axiosInstance.patch(`/api/v1/clients/${clientId}/enable`);
  return response.data;
};

export const downloadBulkImportTemplateApi = async () => {
  const response = await axiosInstance.get('/api/v1/clients/bulk/download-template', {
    responseType: 'blob',
  });
  return response.data;
};

// ==================== LOAN SERVICES (Real Backend) ====================

export const getDocumentWriterByIdApi = async (id) => {
  const response = await axiosInstance.get(`/api/v1/document-writers/${id}`);
  return response.data;
};

export const getAllDocumentWritersApi = async (params) => {
  const response = await axiosInstance.get('/api/v1/document-writers', { params });
  return response.data;
};

export const createDocumentWriterApi = async (data) => {
  const response = await axiosInstance.post('/api/v1/document-writers', data);
  return response.data;
};

export const updateDocumentWriterApi = async (id, data) => {
  const response = await axiosInstance.put(`/api/v1/document-writers/${id}`, data);
  return response.data;
};

export const deleteDocumentWriterApi = async (id) => {
  const response = await axiosInstance.delete(`/api/v1/document-writers/${id}`);
  return response.data;
};

export const addLoanApi = async (loanData) => {
  const response = await axiosInstance.post('/api/v1/loans', loanData);
  return response.data;
};

export const getLoansApi = async (params) => {
  const response = await axiosInstance.get('/api/v1/loans', { params });
  return response.data;
};

export const getLoanByIdApi = async (loanId) => {
  const response = await axiosInstance.get(`/api/v1/loans/${loanId}`);
  return response.data;
};

export const updateLoanApi = async (loanId, loanData) => {
  const response = await axiosInstance.put(`/api/v1/loans/${loanId}`, loanData);
  return response.data;
};

export const getLoansByClientIdApi = async (clientId, params) => {
  const response = await axiosInstance.get(`/api/v1/loans/client/${clientId}`, { params });
  return response.data;
};

export const downloadTamsukApi = async (loanId) => {
  const response = await axiosInstance.get(`/api/v1/pdf/tamsuk/${loanId}`);
  return response.data;
};

export const uploadFinalPdfApi = async (file, pdfType, loanId) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axiosInstance.post(`/api/v1/pdf/save/${loanId}?documentType=${pdfType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getPdfHistoryApi = async (loanId) => {
  const response = await axiosInstance.get(`/api/v1/pdf/history/${loanId}`);
  return response.data;
};

export const previewRegeneratePdfApi = async (loanId) => {
  const response = await axiosInstance.get(`/api/v1/pdf/regenerate/${loanId}`);
  return response.data;
};

export const confirmRegeneratePdfApi = async (loanId, data) => {
  const response = await axiosInstance.post(`/api/v1/pdf/regenerate/confirm/${loanId}`, data);
  return response.data;
};

// ==================== PROFILE (Mock) ====================

export const updateProfileApi = async (userId, details) => {
  await delay();
  const updated = updateUser(userId, details);
  if (!updated) throw new Error('User not found');
  const { password: _, ...userData } = updated;
  return userData;
};

// ==================== AUTHENTICATED USER PROFILE (Real Backend) ====================

export const getUserProfileApi = async () => {
  const response = await axiosInstance.get('/api/v1/users/authenticated/profile');
  return response.data;
};

export const updateUserProfileApi = async (data) => {
  const response = await axiosInstance.put('/api/v1/users/authenticated/profile', data);
  return response.data;
};

export const changeUserPasswordApi = async (data) => {
  const response = await axiosInstance.post('/api/v1/users/authenticated/change-password', data);
  return response.data;
};

// ==================== NOTIFICATION SERVICES (Real Backend) ====================

export const sendSmsApi = async (data) => {
  const response = await axiosInstance.post('/api/v1/notification/sms/send', data);
  return response.data;
};

export const sendBulkSmsApi = async (data) => {
  const response = await axiosInstance.post('/api/v1/notification/sms/send-bulk', data);
  return response.data;
};

export const sendBulkEmailApi = async (data) => {
  const response = await axiosInstance.post('/api/v1/notification/email/bulk-email', data);
  return response.data;
};
