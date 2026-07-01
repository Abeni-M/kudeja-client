import React, { useEffect, useMemo, useState } from 'react';
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from '../../services/userAdminService';
import toast from 'react-hot-toast';
import { exportToCSV } from '../../utils/csvUtils';

import { LuDownload, LuRefreshCw } from 'react-icons/lu';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  const fetchUsers = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await getUsers();
      const list = res?.data?.data ?? res?.data?.users ?? res?.data;
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetRole = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      toast.success(`Role updated to ${role}`);
      await fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await updateUserStatus(userId, isActive);
      toast.success('User status updated');
      await fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const roles = ['All', 'admin', 'sub-admin', 'sales', 'user'];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const name = user.username || user.name || '';
      const email = user.email || '';
      const role = user.role || 'user';

      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'All' || role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const handleExport = () => {
    if (filteredUsers.length === 0) return toast.error('No users to export');
    
    exportToCSV(
      filteredUsers.map(user => ({
        id: user.id || user._id,
        username: user.username || user.name || '—',
        email: user.email || '—',
        role: user.role || 'user',
        status: user.isActive === false ? 'Inactive' : 'Active'
      })),
      `kudeja-users-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'User ID' },
        { key: 'username', label: 'Username' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' }
      ]
    );
    toast.success('Users exported successfully');
  };

  if (loading) return <div style={{ color: 'var(--text-main)' }}>Loading users...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--text-main)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
        <button
          type="button"
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          <LuDownload size={18} />
          Export CSV
        </button>
        <button
          type="button"
          onClick={fetchUsers}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          <LuRefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '20px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-body)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '16px',
                minWidth: '150px'
              }}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role === 'All' ? 'All Roles' : role}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedRole('All');
            }}
            style={{
              padding: '12px 20px',
              backgroundColor: '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-main)' }}>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>ID</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Username</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Email</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Role</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                  <td style={{ padding: '15px' }}>{user.id}</td>
                  <td style={{ padding: '15px', fontWeight: '500' }}>{user.username || user.name}</td>
                  <td style={{ padding: '15px' }}>{user.email}</td>
                  <td style={{ padding: '15px' }}>
                    {user.role}
                  </td>
                  <td style={{ padding: '15px' }}>
                    {user.isActive === false ? 'Inactive' : 'Active'}
                  </td>
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={user.role}
                        onChange={(e) => handleSetRole(user.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--bg-body)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px',
                          fontSize: '14px'
                        }}
                      >
                        {roles.filter(r => r !== 'All').map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(user.id, user.isActive === false)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: user.isActive === false ? '#4CAF50' : '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {user.isActive === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;