import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import toast from 'react-hot-toast';
import './Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token.trim()) {
      toast.error('Reset token is missing. Please use the link from your reset email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword(token.trim(), newPassword);
      setDone(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Reset Password</h2>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#166534',
              fontSize: '0.9rem'
            }}>
              ✅ Password reset successful! Redirecting you to login…
            </div>
            <Link to="/login" style={{ color: '#667eea', fontWeight: 600 }}>Go to Login →</Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Show token field only if not auto-filled from URL */}
              {!searchParams.get('token') && (
                <input
                  type="text"
                  placeholder="Paste reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              )}
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.25rem' }}>
                Min 8 chars, uppercase, lowercase, number &amp; special char (@$!%*?&amp;)
              </p>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <p className="auth-link">
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
