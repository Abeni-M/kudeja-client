// src/pages/admin/AdminOrders.jsx  (replaces the 3-line stub)
import React, { useEffect, useState, useMemo } from 'react';
import { getAllOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import { LuTrash, LuCheck, LuX, LuPackageCheck, LuDownload, LuRefreshCw, LuSearch } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatters';
import { exportToCSV } from '../../utils/csvUtils';
import '../../styles/admin.css';

const STATUS_TABS = ['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

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

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Mark this order as "${status}"?`)) return;
    try {
      await updateOrderStatus(id, status);
      toast.success(`Order marked as ${status}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update order status');
    }
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

  const filtered = useMemo(() => {
    let list = orders;
    if (activeTab !== 'all') list = list.filter((o) => o.status === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          String(o.id).toLowerCase().includes(q) ||
          String(o.user_id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeTab, search]);

  const handleExport = () => {
    exportToCSV(
      filtered.map((o) => ({
        id: o.id,
        date: new Date(o.createdAt).toLocaleDateString(),
        status: o.status,
        total: o.total,
        payment_method: o.payment_method || '—',
        user_id: o.user_id,
        items: Array.isArray(o.items) ? o.items.length : 0,
      })),
      `kudeja-orders-${activeTab}-${Date.now()}`,
      [
        { key: 'id', label: 'Order ID' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'total', label: 'Total (ETB)' },
        { key: 'payment_method', label: 'Payment Method' },
        { key: 'user_id', label: 'User ID' },
        { key: 'items', label: '# Items' },
      ]
    );
  };

  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    STATUS_TABS.slice(1).forEach((s) => {
      counts[s] = orders.filter((o) => o.status === s).length;
    });
    return counts;
  }, [orders]);

  if (loading && orders.length === 0) {
    return <div className="admin-loading">Loading orders…</div>;
  }

  return (
    <div className="admin-page-container">
      {/* Header actions */}
      <div className="admin-page-header">
        <div className="admin-search-bar">
          <LuSearch size={16} />
          <input
            type="text"
            placeholder="Search by Order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleExport} className="admin-btn admin-btn--outline" title="Export CSV">
            <LuDownload size={16} style={{ marginRight: '6px' }} />
            Export CSV
          </button>
          <button onClick={load} className="admin-btn admin-btn--primary" title="Refresh">
            <LuRefreshCw size={16} style={{ marginRight: '6px' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="admin-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="admin-tab-count">{tabCounts[tab] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="admin-error-message">{error}</div>}

      {filtered.length === 0 && !loading ? (
        <div className="admin-empty-state">
          <p>No {activeTab === 'all' ? '' : activeTab} orders found.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total (ETB)</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {String(order.id).slice(0, 8)}…
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{Array.isArray(order.items) ? order.items.length : '—'}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--admin-text)' }}>
                        {order.payment_method || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge status-${order.status || 'pending'}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {order.user_id ? String(order.user_id).slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="admin-table-actions">
                      {order.status === 'pending' && (
                        <button
                          title="Mark as Paid"
                          onClick={() => handleUpdateStatus(order.id, 'paid')}
                          className="admin-icon-btn action-approve"
                        >
                          <LuCheck size={16} />
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button
                          title="Mark as Shipped"
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                          className="admin-icon-btn action-approve"
                        >
                          <LuCheck size={16} />
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          title="Mark as Delivered"
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          className="admin-icon-btn action-approve"
                        >
                          <LuPackageCheck size={16} />
                        </button>
                      )}
                      <button
                        title="Cancel Order"
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        className="admin-icon-btn action-cancel"
                        disabled={
                          order.status === 'cancelled' || order.status === 'delivered'
                        }
                      >
                        <LuX size={16} />
                      </button>
                      <button
                        title="Delete Order"
                        onClick={() => handleDelete(order.id)}
                        className="admin-icon-btn action-delete"
                      >
                        <LuTrash size={16} />
                      </button>
                    </td>
                  </tr>

                  {/* Customer confirmed receipt row */}
                  {order.user_confirmed === true && (
                    <tr key={`feedback-${order.id}`}>
                      <td
                        colSpan="7"
                        style={{
                          padding: '0.6rem 1.5rem',
                          borderLeft: '4px solid #10b981',
                          background: '#f0fdf4',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: '#047857',
                              fontSize: '0.8rem',
                              textTransform: 'uppercase',
                            }}
                          >
                            ✓ Customer Received
                          </span>
                          <span style={{ color: '#f59e0b', letterSpacing: '2px' }}>
                            {'★'.repeat(order.rating || 0)}
                            {'☆'.repeat(5 - (order.rating || 0))}
                          </span>
                          {order.feedback && (
                            <span
                              style={{
                                color: '#374151',
                                fontStyle: 'italic',
                                fontSize: '0.85rem',
                              }}
                            >
                              "{order.feedback}"
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div
            style={{
              padding: '0.75rem 1.5rem',
              color: 'var(--admin-muted)',
              fontSize: '0.85rem',
              borderTop: '1px solid var(--admin-border)',
            }}
          >
            Showing {filtered.length} of {orders.length} orders
          </div>
        </div>
      )}
    </div>
  );
}