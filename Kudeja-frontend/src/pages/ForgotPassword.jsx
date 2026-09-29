import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import toast from 'react-hot-toast';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setSubmitting(true);
      const res = await forgotPassword(email.trim());
      setDone(true);
      if (res.data.resetToken) {
        setResetInfo(res.data);
      }
      toast.success('Reset token generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Forgot Password</h2>

        {!done ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Enter the email address linked to your account. We'll generate a secure reset link for you.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="admin@kudeja.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Generating…' : 'Generate Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#166534',
              fontSize: '0.9rem',
              textAlign: 'left'
            }}>
              ✅ Reset token generated successfully.
            </div>

            {resetInfo && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
                textAlign: 'left',
                wordBreak: 'break-all'
              }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
                  🔗 Copy this reset link and open it in your browser:
                </p>
                <a
                  href={resetInfo.resetUrl}
                  style={{ color: '#667eea', textDecoration: 'underline' }}
                >
                  {resetInfo.resetUrl}
                </a>
                <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>
                  ⏰ This link expires in <strong>1 hour</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        <p className="auth-link">
          Remember your password? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
