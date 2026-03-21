import axiosInstance from './axiosInstance';
import {
  getUsers,
  updateUser,
  getClients,
  addClient as addClientData,
  updateClient as updateClientData,
  deleteClient as deleteClientData,
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

// ==================== CLIENT SERVICES (Mock) ====================

export const getClientsApi = async (userId) => {
  await delay();
  return getClients(userId);
};

export const addClientApi = async (clientData) => {
  await delay();
  return addClientData(clientData);
};

export const updateClientApi = async (clientId, updates) => {
  await delay();
  const updated = updateClientData(clientId, updates);
  if (!updated) throw new Error('Client not found');
  return updated;
};

export const deleteClientApi = async (clientId) => {
  await delay();
  const success = deleteClientData(clientId);
  if (!success) throw new Error('Client not found');
  return { success: true };
};

// ==================== PROFILE (Mock) ====================

export const updateProfileApi = async (userId, details) => {
  await delay();
  const updated = updateUser(userId, details);
  if (!updated) throw new Error('User not found');
  const { password: _, ...userData } = updated;
  return userData;
};
