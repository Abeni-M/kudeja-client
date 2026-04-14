import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidPasswordStrength, getPasswordRequirementsText } from '../utils/validation';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, googleLogin, error: authError } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!isValidPasswordStrength(formData.password)) {
      setError(getPasswordRequirementsText());
      return;
    }

    setError('');
    try {
      setSubmitting(true);
      await register({
        username: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate('/');
    } catch (e) {
      // AuthContext sets a user-friendly error string; keep local fallback too.
      setError(authError || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setSubmitting(true);
      await googleLogin(credentialResponse.credential);
      toast.success('Successfully logged in with Google');
      navigate('/');
    } catch (err) {
      toast.error('Google login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google Login was unsuccessful');
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2>Create Account</h2>
        <p>Join us today</p>
        {(error || authError) && <div className="error-message">{error || authError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="rectangular"
            theme="outline"
          />
        </div>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;