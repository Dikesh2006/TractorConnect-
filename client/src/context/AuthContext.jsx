import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('tractor_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('tractor_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('tractor_token');
    localStorage.removeItem('tractor_user');
    setToken(null);
    setUser(null);
  }, []);

  // Listen to auto-logout event dispatched by axios interceptor on 401
  useEffect(() => {
    const handleAuthExpired = () => logout();
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [logout]);

  // Verify token on app load if token exists
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('tractor_token');
      if (savedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          if (res.data?.success && res.data.data?.user) {
            setUser(res.data.data.user);
            localStorage.setItem('tractor_user', JSON.stringify(res.data.data.user));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [logout]);

  const login = async (mobile, password) => {
    const res = await apiClient.post('/auth/login', { mobile, password });
    if (res.data?.success && res.data.data) {
      const { user: loggedInUser, token: authToken } = res.data.data;
      localStorage.setItem('tractor_token', authToken);
      localStorage.setItem('tractor_user', JSON.stringify(loggedInUser));
      setToken(authToken);
      setUser(loggedInUser);
      return loggedInUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    if (res.data?.success && res.data.data) {
      const { user: registeredUser, token: authToken } = res.data.data;
      localStorage.setItem('tractor_token', authToken);
      localStorage.setItem('tractor_user', JSON.stringify(registeredUser));
      setToken(authToken);
      setUser(registeredUser);
      return registeredUser;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const registerFarmer = async (farmerData) => {
    const res = await apiClient.post('/auth/farmer/register', farmerData);
    if (res.data?.success && res.data.data) {
      const { user: registeredUser, token: authToken } = res.data.data;
      localStorage.setItem('tractor_token', authToken);
      localStorage.setItem('tractor_user', JSON.stringify(registeredUser));
      setToken(authToken);
      setUser(registeredUser);
      return registeredUser;
    }
    throw new Error(res.data?.message || 'Farmer registration failed');
  };

  const registerOwner = async (ownerData) => {
    const res = await apiClient.post('/auth/owner/register', ownerData);
    if (res.data?.success && res.data.data) {
      const { user: registeredUser, token: authToken } = res.data.data;
      localStorage.setItem('tractor_token', authToken);
      localStorage.setItem('tractor_user', JSON.stringify(registeredUser));
      setToken(authToken);
      setUser(registeredUser);
      return registeredUser;
    }
    throw new Error(res.data?.message || 'Tractor Owner registration failed');
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('tractor_user', JSON.stringify(updatedUserData));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user && user.role === 'admin'),
    isCustomer: Boolean(user && user.role === 'customer'),
    isOwner: Boolean(user && user.role === 'owner'),
    isApprovedOwner: Boolean(user && user.role === 'owner' && user.isApproved),
    login,
    register,
    registerFarmer,
    registerOwner,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

