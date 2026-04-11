import React from 'react';
import { useData } from '../../context/DataContext';
import { getDashboardStats } from '../../services/categoryService';
import api from '../../services/api';
import { formatPrice } from '../../utils/formatters';
import { exportToCSV } from '../../utils/csvUtils';
import { LuDownload, LuRefreshCw } from 'react-icons/lu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import '../../styles/admin.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = () => {
  const [stats, setStats] = React.useState({
    orders: 0,
    products: 0,
    users: 0,
    revenue: 0,
    growth: 0
  });
  const [chartData, setChartData] = React.useState(null);
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.data?.success) {
        const { users, products, orders, revenue, growth, notifications: fetchedNotifs, activityByDay, ordersByStatus, topCategories } = res.data.data;
        // Set only the 5 overview metrics in stats
        setStats({ users, products, orders, revenue, growth });
        setChartData({ activityByDay, ordersByStatus, topCategories });
        if (fetchedNotifs) setNotifications(fetchedNotifs);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportToCSV(
      [
        { metric: 'Total Orders', value: stats.orders, unit: 'Count' },
        { metric: 'Total Products', value: stats.products, unit: 'Count' },
        { metric: 'Total Users', value: stats.users, unit: 'Count' },
        { metric: 'Total Revenue', value: stats.revenue, unit: 'ETB' },
        { metric: 'Overall Growth', value: `${stats.growth}%`, unit: 'Percentage' }
      ],
      `kudeja-dashboard-summary-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
        { key: 'unit', label: 'Unit' }
      ]
    );
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats();
  };

  const clearNotifications = async () => {
    try {
      const res = await api.delete('/admin/users/dashboard/notifications/clear');
      if (res.data?.success) {
        setNotifications([]);
        toast.success('All notifications deleted permanently');
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const removeNotification = async (id) => {
    try {
      const res = await api.delete(`/admin/users/dashboard/notifications/${id}`);
      if (res.data?.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const labelize = (key) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

  const renderStatValue = (key, value) => {
    if (key === 'growth') return `${value}%`;
    if (key === 'revenue') return formatPrice(value);
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  const pillClass = (type) => {
    if (type === 'success') return 'admin-pill admin-pill-success';
    if (type === 'warning') return 'admin-pill admin-pill-warning';
    if (type === 'error') return 'admin-pill admin-pill-error';
    return 'admin-pill admin-pill-info';
  };

  if (loading && !chartData) {
    return <div className="admin-loading">Loading dashboard data...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-row" style={{ marginBottom: '1.25rem', justifyContent: 'flex-end' }}>
        <div className="admin-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="admin-btn admin-btn--outline" onClick={handleExport}>
            <LuDownload size={16} style={{ marginRight: '6px' }} />
            Export Summary
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={handleRefresh}>
            <LuRefreshCw size={16} style={{ marginRight: '6px' }} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="admin-grid admin-grid--stats" style={{ marginBottom: '1.25rem' }}>
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="admin-card">
            <p className="admin-stat-label">{labelize(key)}</p>
            <p className="admin-stat-value">{renderStatValue(key, value)}</p>
          </div>
        ))}
      </div>

      {chartData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="admin-card">
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--admin-text)', fontWeight: 800 }}>Top Product Categories</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData.topCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                     {chartData.topCategories?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--admin-text)', fontWeight: 800 }}>Low Stock Alerts</h3>
            {chartData.lowStockProducts?.length > 0 ? (
              <div className="low-stock-list">
                {chartData.lowStockProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    <span style={{ 
                      backgroundColor: p.stock === 0 ? '#fee2e2' : '#fef3c7', 
                      color: p.stock === 0 ? '#ef4444' : '#f59e0b',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700
                    }}>
                      {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--admin-muted)', textAlign: 'center', padding: '2rem 0' }}>All products are well stocked.</p>
            )}
          </div>
        </div>
      )}



      <div className="admin-card">
        <div className="admin-row" style={{ marginBottom: '0.9rem' }}>
          <h3 style={{ margin: 0, color: 'var(--admin-text)', fontWeight: 800 }}>
            Recent Activity & Notifications
          </h3>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={clearNotifications}
            disabled={notifications.length === 0}
          >
            Clear All
          </button>
        </div>

        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--admin-muted)', padding: '1rem 0' }}>
            No recent activity or notifications.
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div key={notification.id} className="admin-notification" style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="admin-notification-title" style={{ margin: 0, fontWeight: 600, color: 'var(--admin-text)' }}>{notification.message}</p>
                  <p className="admin-notification-meta" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--admin-muted)' }}>{notification.time}</p>
                </div>
                <div className="admin-actions">
                  <span className={pillClass(notification.type)} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '999px' }}>{notification.type || 'info'}</span>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={() => removeNotification(notification.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;