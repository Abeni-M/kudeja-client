import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const { settings, updateSettingsData } = useData();
  const { theme, toggleTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.title = localSettings.siteTitle || 'Kudeja Admin';
  }, [localSettings.siteTitle]);

  const handleInputChange = (key, value) => {
    if (key === 'darkMode') {
      toggleTheme();
    }
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    try {
      updateSettingsData(localSettings);
      setSaved(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings = {
        siteTitle: 'Kudeja Admin',
        siteDescription: 'Kudeja Administration Panel',
        maintenanceMode: false,
        userRegistration: true,
        emailNotifications: true,
        darkMode: false,
        itemsPerPage: 25,
        timezone: 'UTC'
      };
      if (theme === 'dark') toggleTheme(); 
      updateSettingsData(defaultSettings);
      setLocalSettings(defaultSettings);
      toast.success('Settings reset to default!');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '10px' }}>

      {saved && (
        <div style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
           Settings saved successfully!
        </div>
      )}

      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        color: 'var(--text-main)',
        padding: '30px', 
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow)',
        transition: 'var(--transition)',
        border: '1px solid var(--border-color)'
      }}>
        {/* General Settings */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
            General Settings
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Site Title
            </label>
            <input
              type="text"
              value={localSettings.siteTitle}
              onChange={(e) => handleInputChange('siteTitle', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Site Description
            </label>
            <textarea
              value={localSettings.siteDescription}
              onChange={(e) => handleInputChange('siteDescription', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '16px',
                minHeight: '100px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Items Per Page
            </label>
            <select
              value={localSettings.itemsPerPage}
              onChange={(e) => handleInputChange('itemsPerPage', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '16px'
              }}
            >
              <option value={10}>10 items</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Timezone
            </label>
            <select
              value={localSettings.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '16px'
              }}
            >
              <option value="UTC">UTC</option>
              <option value="EST">EST (Eastern Time)</option>
              <option value="PST">PST (Pacific Time)</option>
              <option value="CET">CET (Central European Time)</option>
            </select>
          </div>
        </div>

        {/* Toggle Settings */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
            Feature Toggles
          </h3>
          
          {[
            { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Put site under maintenance' },
            { key: 'userRegistration', label: 'User Registration', description: 'Allow new user registrations' },
            { key: 'emailNotifications', label: 'Email Notifications', description: 'Send email notifications' },
            { key: 'darkMode', label: 'Dark Mode', description: 'Enable dark theme' }
          ].map(({ key, label, description }) => (
            <div key={key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: 'var(--bg-body)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              marginBottom: '10px'
            }}>
              <div>
                <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{label}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{description}</div>
              </div>
              <button
                onClick={() => {
                  if (key === 'darkMode') {
                    toggleTheme();
                  } else {
                    handleInputChange(key, !localSettings[key]);
                  }
                }}
                style={{
                  padding: '8px 20px',
                  backgroundColor: (key === 'darkMode' ? theme === 'dark' : localSettings[key]) ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                {(key === 'darkMode' ? theme === 'dark' : localSettings[key]) ? 'ON' : 'OFF'}
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <button 
            onClick={handleResetToDefault}
            style={{
              padding: '15px 25px',
              backgroundColor: '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              flex: 1,
              fontSize: '16px'
            }}
          >
            Reset to Default
          </button>
          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            style={{
              padding: '15px 25px',
              backgroundColor: isSaving ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              flex: 2,
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isSaving ? 'Saving...' : ' Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;