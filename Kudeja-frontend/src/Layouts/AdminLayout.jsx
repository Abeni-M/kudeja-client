import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useMessages } from '../context/MessageContext';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';
import {
  LuLayoutDashboard,
  LuPackage,
  LuShoppingBag,
  LuUsers,
  LuSettings,
  LuTag,
  LuMenu,
  LuX,
  LuLogOut,
  LuChevronRight,
  LuMail,
  LuMonitor
} from 'react-icons/lu';

function AdminLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { adminUnreadCount } = useMessages();

  const allNavItems = [
    { path: '/admin', icon: LuLayoutDashboard, label: 'Dashboard', permission: 'dashboard:read' },
    { path: '/admin/products', icon: LuPackage, label: 'Products', permission: 'products:read' },
    { path: '/admin/orders', icon: LuShoppingBag, label: 'Orders', permission: 'orders:read' },
    { path: '/admin/users', icon: LuUsers, label: 'Users', permission: 'users:read' },
    { path: '/admin/categories', icon: LuTag, label: 'Categories', permission: 'categories:read' },
    { path: '/admin/ads', icon: LuMonitor, label: 'Ads', permission: 'ads:read' },
    { path: '/admin/messages', icon: LuMail, label: 'Messages', permission: 'messages:read' },
    { path: '/admin/settings', icon: LuSettings, label: 'Settings', permission: 'settings:read' },
  ];

  // Simple role-based filtration for frontend if detailed permissions aren't synced
  const navItems = allNavItems.filter(item => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'sales') return ['/admin', '/admin/orders'].includes(item.path);
    if (user.role === 'sub-admin') return ['/admin', '/admin/products', '/admin/categories', '/admin/messages', '/admin/users', '/admin/ads'].includes(item.path);
    return false;
  });

  return (
    <div className={`admin-shell ${sidebarOpen ? 'admin-shell--sidebar-open' : 'admin-shell--sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          {sidebarOpen ? (
            <div className="admin-brand">
              <div className="admin-brand-mark" aria-hidden="true">
                <LuPackage size={18} />
              </div>
              <div className="admin-brand-text">
                <div className="admin-brand-title">KUDE<span className="admin-brand-j">J</span>A</div>
                <div className="admin-brand-sub">ADMIN PANEL</div>
              </div>
            </div>
          ) : (
            <div className="admin-brand-mark admin-brand-mark--solo" aria-hidden="true">
              <LuPackage size={18} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="admin-icon-btn"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <LuX size={20} /> : <LuMenu size={20} />}
          </button>
        </div>

        <nav className="admin-nav">
          <ul className="admin-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.label === 'Messages' && adminUnreadCount > 0 && (
                          <span style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            borderRadius: '12px', 
                            padding: '1px 8px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            marginLeft: '8px'
                          }}>
                            {adminUnreadCount}
                          </span>
                        )}
                        {isActive && <LuChevronRight size={16} />}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <Link
            to="/"
            className="admin-nav-link admin-nav-link--muted"
          >
            <LuLogOut size={20} />
            {sidebarOpen && <span>Back to Store</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-inner">
            <div>
              <h1 className="admin-topbar-title">
                {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="admin-topbar-subtitle">Welcome back.</p>
            </div>
            <div className="admin-avatar" aria-hidden="true" />
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;