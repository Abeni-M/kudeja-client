import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './Login.css';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, googleLogin, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await login(email, password);
      navigate('/');
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
    <div className="login-page">
      <div className="login-card">
        <h2>Login</h2>
        {error ? <div className="error-message">{error}</div> : null}
        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', marginBottom: '1rem' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            shape="rectangular"
            theme="outline"
          />
        </div>

        <p className="auth-link">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;