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
  const [token, setToken] = useState(localStorage.getItem('live_darshan_token'));
  const [loading, setLoading] = useState(true);

  // Load profile when token changes
  const loadProfile = async (currentToken) => {
    try {
      if (!currentToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await API.get('/auth/profile');
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('live_darshan_user', JSON.stringify(response.data.user));
      } else {
        logout();
      }
    } catch (error) {
      console.error('loadProfile error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfile(token);
    } else {
      setLoading(false);
    }

    // Listener for interceptor logouts
    const handleForceLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth_logout', handleForceLogout);
    return () => {
      window.removeEventListener('auth_logout', handleForceLogout);
    };
  }, [token]);

  const login = async (phone, password) => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { phone, password });
      if (response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('live_darshan_token', receivedToken);
        localStorage.setItem('live_darshan_user', JSON.stringify(receivedUser));
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
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('live_darshan_token', receivedToken);
        localStorage.setItem('live_darshan_user', JSON.stringify(receivedUser));
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
    localStorage.removeItem('live_darshan_token');
    localStorage.removeItem('live_darshan_user');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    if (token) {
      await loadProfile(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) || defaultAuthState;
