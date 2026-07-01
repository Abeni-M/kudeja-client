import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import { LuTrash, LuCheck, LuX, LuPackageCheck, LuDownload, LuRefreshCw } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatters';
import '../../styles/admin.css';
import { exportToCSV } from '../../utils/csvUtils';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllOrders();
      const data = res?.data?.data ?? res?.data?.orders ?? res?.data;
      setOrders(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Mark this order as ${status}?`)) return;
    try {
      await updateOrderStatus(id, status);
      toast.success(`Order marked as ${status}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleExport = () => {
    if (orders.length === 0) return toast.error('No orders to export');
    
    exportToCSV(
      orders.map(order => ({
        id: order.id,
        date: new Date(order.createdAt).toLocaleString(),
        customer: order.user_id,
        total: order.total,
        status: order.status || 'pending',
        shippingAddress: order.shipping_address || '—'
      })),
      `kudeja-orders-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Order ID' },
        { key: 'date', label: 'Date' },
        { key: 'customer', label: 'Customer ID' },
        { key: 'total', label: 'Total (ETB)' },
        { key: 'status', label: 'Status' },
        { key: 'shippingAddress', label: 'Shipping Address' }
      ]
    );
    toast.success('Orders exported successfully');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;
    try {
      await deleteOrder(id);
      toast.success('Order deleted');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete order');
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + (Number(o.total) || 0), 0)
  };

  if (loading && orders.length === 0) {
    return <div className="admin-loading">Loading orders...</div>;
  }

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0 }}>Order Management</h2>
          <p style={{ margin: '5px 0 0 0', color: 'var(--admin-muted)', fontSize: '0.9rem' }}>Manage and process customer orders.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExport} className="admin-btn admin-btn--outline">
            <LuDownload size={16} />
            Export CSV
          </button>
          <button onClick={load} className="admin-btn admin-btn--primary">
            <LuRefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-grid admin-grid--stats" style={{ marginBottom: '20px' }}>
        <div className="admin-card">
          <p className="admin-stat-label">Total Orders</p>
          <p className="admin-stat-value">{stats.total}</p>
        </div>
        <div className="admin-card">
          <p className="admin-stat-label">Pending</p>
          <p className="admin-stat-value" style={{ color: 'var(--warning-color)' }}>{stats.pending}</p>
        </div>
        <div className="admin-card">
          <p className="admin-stat-label">Delivered</p>
          <p className="admin-stat-value" style={{ color: 'var(--success-color)' }}>{stats.delivered}</p>
        </div>
        <div className="admin-card">
          <p className="admin-stat-label">Revenue</p>
          <p className="admin-stat-value">{formatPrice(stats.revenue)}</p>
        </div>
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {orders.length === 0 && !loading && !error ? (
        <div className="admin-empty-state">
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total (ETB)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td>{String(order.id).slice(0, 8)}...</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      {formatPrice(order.total)}
                    </td>
                    <td>
                      <span className={`admin-status-badge status-${order.status || 'pending'}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="admin-table-actions">
                      {order.status === 'pending' && (
                        <button
                          title="Mark as Paid"
                          onClick={() => handleUpdateStatus(order.id, 'paid')}
                          className="admin-icon-btn action-approve"
                        >
                          <LuCheck size={18} />
                        </button>
                      )}
                      {(order.status === 'paid' || order.status === 'pending') && (
                        <button
                          title="Mark as Shipped"
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                          className="admin-icon-btn action-approve"
                        >
                          <LuCheck size={18} />
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          title="Mark as Delivered"
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="admin-icon-btn action-approve"
                        >
                          <LuPackageCheck size={18} />
                        </button>
                      )}
                      <button
                        title="Cancel Order"
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        className="admin-icon-btn action-cancel"
                        disabled={order.status === 'cancelled' || order.status === 'delivered'}
                      >
                        <LuX size={18} />
                      </button>
                      <button
                        title="Delete Order"
                        onClick={() => handleDelete(order.id)}
                        className="admin-icon-btn action-delete"
                      >
                        <LuTrash size={18} />
                      </button>
                    </td>
                  </tr>
                  {order.user_confirmed === true && (
                    <tr key={`feedback-${order.id}`} style={{ background: '#f8fafc' }}>
                      <td colSpan="5" style={{ padding: '0.75rem 1.5rem', borderLeft: '4px solid #10b981', background: '#f0fdf4' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, color: '#047857', fontSize: '0.85rem', textTransform: 'uppercase' }}>✓ Customer Received</span>
                            <span style={{ color: '#f59e0b', letterSpacing: '2px', fontSize: '1rem' }}>
                              {'★'.repeat(order.rating || 0)}{'☆'.repeat(5 - (order.rating || 0))}
                            </span>
                          </div>
                          {order.feedback && (
                            <div style={{ color: '#374151', fontStyle: 'italic', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                              "{order.feedback}"
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}