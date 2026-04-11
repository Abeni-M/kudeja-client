
import React from 'react';
import { Link } from 'react-router-dom';
import { useMessages } from '../../context/MessageContext';

function AdminNavbar() {
  const { adminUnreadCount } = useMessages();
  return (
    <nav className="admin-nav-inline" style={{ 
      background: 'var(--bg-navbar)', 
      color: 'var(--text-main)', 
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      borderBottom: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img 
          src="/src/images/kudeja logo.png" 
          alt="Kudeja Logo" 
          className="nav-logo-img" 
          style={{ height: '60px', width: 'auto', objectFit: 'contain' }} 
        />
      </Link>
      <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Admin</h3>
      <Link to="/admin/dashboard" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
      <Link to="/admin/products" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Products</Link>
      <Link to="/admin/orders" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Orders</Link>
      <Link to="/admin/users" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Users</Link>
      <Link to="/admin/categories" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Categories</Link>
      <Link to="/admin/ads" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Ads</Link>
      <Link to="/admin/messages" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
        Messages 
        {adminUnreadCount > 0 && (
          <span style={{ 
            background: '#d11b1b', 
            color: 'white', 
            borderRadius: '50%', 
            width: '18px', 
            height: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '0.7rem' 
          }}>
            {adminUnreadCount}
          </span>
        )}
      </Link>
      <Link to="/" style={{ color: 'var(--primary)', marginLeft: 'auto', fontWeight: 600, textDecoration: 'none' }}>View Site</Link>
    </nav>
  );
}

// CRITICAL: This must be default export
export default AdminNavbar;  // ← This line must say "export default"