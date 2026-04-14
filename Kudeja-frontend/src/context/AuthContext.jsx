import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, getCurrentUser } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const res = await apiLogin({ email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const res = await apiRegister(userData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const googleLogin = async (credential) => {
    try {
      setError(null);
      const res = await apiGoogleLogin(credential);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isStaff = ['admin', 'sub-admin', 'sales'].includes(user?.role);
  const isSubAdmin = user?.role === 'sub-admin';
  const isSales = user?.role === 'sales';

  const value = {
    user,
    loading,
    error,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
    isStaff,
    isSubAdmin,
    isSales,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};