import axios from 'axios';
import { BASE_API_URL } from './config';
import { generateHmac } from '../utils/hmac';

const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const resolveUrl = (relativeUrl, baseURL) => {
  return new URL(relativeUrl, baseURL || window.location.origin);
};

// Request interceptor — attach access token and HMAC
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Determine content type (skip multipart/form-data)
    const contentType = config.headers['Content-Type'] || config.headers['content-type'];
    const isMultipart = contentType && contentType.toString().startsWith('multipart/form-data');
    const isFormData = config.data instanceof FormData;

    if (!isMultipart && !isFormData) {
      // Build fullURL logically identical to the Java Backend
      // Using axiosInstance.getUri guarantees we use the exact same param serialization that axios will send over the network.
      let fullUriFromAxios = config.url;
      try {
        fullUriFromAxios = axiosInstance.getUri(config);
      } catch (e) {
        // fallback just in case getUri fails
      }
      
      const urlObj = new URL(fullUriFromAxios, config.baseURL || window.location.origin);
      const path = urlObj.pathname.toLowerCase();
      
      let queryString = "";
      if (urlObj.search && urlObj.search.length > 1) {
        const searchRaw = urlObj.search.substring(1);
        // Equivalent to Arrays.sort(pairs, String.CASE_INSENSITIVE_ORDER)
        queryString = searchRaw.split('&').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).join('&');
      }
      
      let fullUrl = path;
      if (queryString) {
        fullUrl += "?" + queryString.toLowerCase();
      }

      const method = (config.method || 'GET').toUpperCase();
      const hmacSignature = await generateHmac(config.data, method, fullUrl);
      
      if (hmacSignature) {
        config.headers['X-HMAC-Request-Signature'] = hmacSignature;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const forceLogout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new CustomEvent('auth-force-logout'));
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints themselves
    if (error.response?.status === 401) {
      const data = error.response.data || {};
      const isSessionExpired = 
        data.developerMessage === 'Refresh token has expired' || 
        data.message === 'Session Expired, Please login again';

      if (isSessionExpired) {
        forceLogout();
        if (data.message || data.developerMessage) {
          error.message = data.message || data.developerMessage;
        }
        return Promise.reject(error);
      }
      
      if (
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/refresh')
      ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Backend expects refresh token as Bearer header, empty object body
        const refreshBody = {};
        const refreshPath = '/api/v1/auth/refresh';
        const hmacSignature = await generateHmac(refreshBody, 'POST', refreshPath);

        const response = await axios.post(
          `${BASE_API_URL}${refreshPath}`,
          refreshBody,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${refreshToken}`,
              ...(hmacSignature ? { 'X-HMAC-Request-Signature': hmacSignature } : {})
            },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update stored user with any new data from refresh response
        try {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser && response.data) {
            const updatedUser = {
              ...storedUser,
              tokenVersion: response.data.tokenVersion ?? storedUser.tokenVersion,
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch { /* ignore */ }

        // Notify AuthContext to sync its in-memory state
        window.dispatchEvent(new CustomEvent('auth-token-refreshed'));

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        
        // Map backend message to the refresh error
        if (refreshError.response?.data) {
          const data = refreshError.response.data;
          if (data.message || data.developerMessage) {
            refreshError.message = data.message || data.developerMessage;
          }
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  }

    if (error.response && error.response.data) {
      const data = error.response.data;
      if (data.message || data.developerMessage) {
        error.message = data.message || data.developerMessage;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
