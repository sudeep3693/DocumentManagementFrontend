import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginApi, updateProfileApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Decode JWT payload (base64url)
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const loadStoredAuth = () => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = JSON.parse(localStorage.getItem('user'));
    if (accessToken && user) return { accessToken, refreshToken, user };
  } catch {
    /* ignore */
  }
  return { accessToken: null, refreshToken: null, user: null };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    const { accessToken, refreshToken, user } = loadStoredAuth();
    return {
      accessToken,
      refreshToken,
      user,
      isAuthenticated: !!accessToken,
    };
  });

  const persistAuth = (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState({ user, accessToken, refreshToken, isAuthenticated: true });
  };

  // Sync React state when axios interceptor refreshes tokens or forces logout
  useEffect(() => {
    const handleTokenRefreshed = () => {
      const { accessToken, refreshToken, user } = loadStoredAuth();
      if (accessToken && user) {
        setAuthState({ user, accessToken, refreshToken, isAuthenticated: true });
      }
    };

    const handleForceLogout = () => {
      setAuthState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    };

    window.addEventListener('auth-token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth-force-logout', handleForceLogout);
    return () => {
      window.removeEventListener('auth-token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth-force-logout', handleForceLogout);
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await loginApi(username, password);

    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken || null;

    // Derive role from roles array
    const roles = data.roles || [];
    let role = 'user';
    if (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) {
      role = 'admin';
    }

    // Build user object from response
    const user = {
      username: data.username || username,
      name: data.username || username,
      roles: roles,
      role: role,
      tenantId: data.tenantId || null,
      tokenVersion: data.tokenVersion || null,
      status: 'approved',
    };

    persistAuth(user, accessToken, refreshToken);
    return user;
  }, []);

  const updateProfile = useCallback(async (details) => {
    const updatedUser = await updateProfileApi(authState.user.id, details);
    persistAuth(updatedUser, authState.accessToken, authState.refreshToken);
    return updatedUser;
  }, [authState.user, authState.accessToken, authState.refreshToken]);

  const updateUser = useCallback((userUpdates) => {
    const updatedUser = { ...authState.user, ...userUpdates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  }, [authState.user]);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setAuthState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  }, []);

  const value = {
    user: authState.user,
    token: authState.accessToken,
    isAuthenticated: authState.isAuthenticated,
    role: authState.user?.role || null,
    status: authState.user?.status || null,
    login,
    updateProfile,
    updateUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
