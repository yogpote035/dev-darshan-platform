import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const defaultAuthState = {
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,
  login: async () => ({ success: false, message: 'Auth not ready.' }),
  register: async () => ({ success: false, message: 'Auth not ready.' }),
  logout: () => { },
  refreshUser: async () => { }
};

const AuthContext = createContext(defaultAuthState);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('live_darshan_token'));
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem('live_darshan_user');
    localStorage.removeItem('live_darshan_token');
    setToken(null);
    setUser(null);
  };

  const loadProfile = async () => {
    try {
      const response = await API.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('live_darshan_user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('loadProfile error:', error);
      }
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('live_darshan_token')) loadProfile();
    else setLoading(false);

    // Listener for interceptor logouts
    const handleForceLogout = () => {
      clearSession();
    };

    window.addEventListener('auth_logout', handleForceLogout);
    return () => {
      window.removeEventListener('auth_logout', handleForceLogout);
    };
  }, []);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { phone, password });
      if (response.data.success) {
        const { user: receivedUser, token: receivedToken } = response.data;
        localStorage.setItem('live_darshan_user', JSON.stringify(receivedUser));
        localStorage.setItem('live_darshan_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login request error:', error);
      const msg = error.response?.data?.message || 'Invalid phone or password.';
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName, phone, password, confirmPassword, referralCode = '') => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', {
        full_name: fullName,
        phone,
        password,
        confirm_password: confirmPassword,
        referral_code: referralCode
      });

      if (response.data.success) {
        const { user: receivedUser, token: receivedToken } = response.data;
        localStorage.setItem('live_darshan_user', JSON.stringify(receivedUser));
        localStorage.setItem('live_darshan_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration request error:', error);
      const errors = error.response?.data?.errors;
      const msg = errors && errors.length > 0 ? errors[0].msg : (error.response?.data?.message || 'Registration failed.');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    API.post('/auth/logout').catch(() => { });
    clearSession();
    setLoading(false);
  };

  const refreshUser = async () => {
    await loadProfile();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) || defaultAuthState;
