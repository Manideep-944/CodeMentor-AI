import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, loginUser, registerUser, logoutUser, updateProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('codementor_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated user profile on application startup
  useEffect(() => {
    let isMounted = true;

    const restoreUser = async () => {
      const storedToken = localStorage.getItem('codementor_token');
      if (storedToken) {
        const res = await getMe();
        if (isMounted) {
          if (res.success && res.data) {
            setUser(res.data);
            setToken(storedToken);
          } else {
            // Invalid or expired token
            localStorage.removeItem('codementor_token');
            localStorage.removeItem('codementor_user');
            setUser(null);
            setToken(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    restoreUser();

    // Event listener for token expiration triggered by API interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('codementor_auth_expired', handleAuthExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('codementor_auth_expired', handleAuthExpired);
    };
  }, []);

  // Register function
  const register = async (name, email, password) => {
    const res = await registerUser(name, email, password);
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      localStorage.setItem('codementor_token', userToken);
      localStorage.setItem('codementor_user', JSON.stringify(userData));
      setUser(userData);
      setToken(userToken);
      return { success: true, user: userData };
    }
    return { success: false, error: res.error };
  };

  // Login function
  const login = async (email, password) => {
    const res = await loginUser(email, password);
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      localStorage.setItem('codementor_token', userToken);
      localStorage.setItem('codementor_user', JSON.stringify(userData));
      setUser(userData);
      setToken(userToken);
      return { success: true, user: userData };
    }
    return { success: false, error: res.error };
  };

  // Update profile function
  const updateProfileData = async (name, currentPassword, newPassword) => {
    const res = await updateProfile(name, currentPassword, newPassword);
    if (res.success && res.data) {
      setUser((prev) => ({ ...prev, ...res.data }));
      const currentStored = JSON.parse(localStorage.getItem('codementor_user') || '{}');
      localStorage.setItem('codementor_user', JSON.stringify({ ...currentStored, ...res.data }));
      return { success: true, user: res.data, message: res.message };
    }
    return { success: false, error: res.error };
  };

  // Logout function
  const logout = async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    register,
    updateProfileData,
    logout,
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

export default AuthContext;
