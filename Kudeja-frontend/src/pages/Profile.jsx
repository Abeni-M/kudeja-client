import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import { isValidPasswordStrength, getPasswordRequirementsText } from '../utils/validation';
import { LuCamera, LuUpload, LuTrash2, LuImage } from 'react-icons/lu';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    address: user?.address || '',
    profilePicture: user?.profilePicture || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <p>Please login to view profile</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDesktopFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Please select an image file (PNG, JPG, WebP).' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ type: 'error', message: 'Image size should be under 10MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setFormData(prev => ({ ...prev, profilePicture: dataUrl }));
      setStatus({ type: 'success', message: 'Image loaded from desktop! Click "Save Changes" to apply.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    if (formData.password && !isValidPasswordStrength(formData.password)) {
      setStatus({ type: 'error', message: getPasswordRequirementsText() });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Create update object, only include password if it's set
      const updateData = {
        username: formData.username,
        address: formData.address,
        profilePicture: formData.profilePicture,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await updateProfile(updateData);
      if (res.data.success) {
        updateUser(res.data.user);
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
        setIsEditing(false);
        // Clear password fields
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h1>Professional Profile</h1>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-logout"
          >
            <span>Logout</span>
          </button>
        </div>

        {status.message && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}

        {/* Hidden desktop file picker */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleDesktopFile(file);
          }}
        />

        {isEditing ? (
          <form className="edit-form" onSubmit={handleSubmit}>
            <div className="form-group full-width">
              <label>Profile Picture</label>
              <div className="profile-pic-uploader">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div className="avatar-container">
                    <div className="avatar-circle" style={{ width: '84px', height: '84px', fontSize: '2rem' }}>
                      {formData.profilePicture ? (
                        <img src={formData.profilePicture} alt={formData.username} />
                      ) : (
                        getInitials(formData.username)
                      )}
                    </div>
                  </div>
                  <div className="desktop-pick-row">
                    <button
                      type="button"
                      className="desktop-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <LuUpload size={16} /> Choose Picture from Desktop
                    </button>
                    {formData.profilePicture && (
                      <button
                        type="button"
                        className="remove-pic-btn"
                        onClick={() => setFormData(prev => ({ ...prev, profilePicture: '' }))}
                      >
                        <LuTrash2 size={15} /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleChange}
                    placeholder="Or paste an image web URL (https://...)"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your full address"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>New Password (Optional)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-avatar-section">
              <div className="avatar-container">
                <div className="avatar-circle">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.username} />
                  ) : (
                    getInitials(user.username)
                  )}
                </div>
                <button
                  type="button"
                  className="avatar-cam-btn"
                  onClick={() => {
                    setIsEditing(true);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  title="Choose picture from desktop"
                >
                  <LuCamera size={18} />
                </button>
              </div>
              <div className="profile-main-info">
                <h2>{user.username}</h2>
                <div style={{ marginTop: '0.5rem' }}>
                  <span className="role-badge">{user.role}</span>
                </div>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="info-group">
                <label>Username</label>
                <div className="info-value">{user.username}</div>
              </div>
              <div className="info-group">
                <label>Email Address</label>
                <div className="info-value">{user.email}</div>
              </div>
              <div className="info-group full-width">
                <label>Address</label>
                <div className="info-value">{user.address || 'Address not set'}</div>
              </div>
              <div className="info-group">
                <label>Account Role</label>
                <div className="info-value" style={{ textTransform: 'capitalize' }}>{user.role}</div>
              </div>
              <div className="info-group">
                <label>Member Since</label>
                <div className="info-value">
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Recently'}
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                <span>✏️</span> Edit Profile
              </button>
              <button className="btn-secondary" onClick={() => navigate('/my-messages')}>
                <span>✉️</span> My Messages
              </button>
              <button className="btn-secondary" onClick={() => navigate('/orders')}>
                <span>📦</span> My Orders
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;