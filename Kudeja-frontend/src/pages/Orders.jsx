import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, confirmOrderReceipt } from '../services/orderService';
import { LuStar } from 'react-icons/lu';
import { formatPrice } from '../utils/formatters';
import toast from 'react-hot-toast';
import './Orders.css';

const STATUS_COLORS = {
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#92400e' },
  paid: { bg: 'rgba(59,130,246,0.12)', color: '#1d4ed8' },
  shipped: { bg: 'rgba(139,92,246,0.12)', color: '#6d28d9' },
  delivered: { bg: 'rgba(16,185,129,0.12)', color: '#047857' },
  cancelled: { bg: 'rgba(239,68,68,0.12)', color: '#b91c1c' },
};

function StatusBadge({ status }) {
  const s = status || 'pending';
  const style = STATUS_COLORS[s] || STATUS_COLORS.pending;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.8rem',
      borderRadius: '999px',
      fontSize: '0.8rem',
      fontWeight: 700,
      textTransform: 'capitalize',
      background: style.bg,
      color: style.color,
    }}>
      {s}
    </span>
  );
}

function FeedbackForm({ order, onConfirmed }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating to confirm receipt.');

    setSubmitting(true);
    try {
      await confirmOrderReceipt(order.id, { rating, feedback });
      toast.success('Thank you! Order confirmed and feedback submitted.');
      onConfirmed();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="order-feedback-form">
      <h4>Confirm Receipt & Leave Feedback</h4>
      <p>Did you receive this order? How was your experience?</p>

      <div className="feedback-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${(hoverRating || rating) >= star ? 'active' : ''}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          >
            <LuStar size={24} fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>

      <textarea
        placeholder="Tell us what you think (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows="2"
      />

      <button type="submit" disabled={submitting || rating === 0} className="btn-confirm-receipt">
        {submitting ? 'Submitting...' : 'Confirm Delivery & Submit'}
      </button>
    </form>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  const load = async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const res = await getOrders();
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
    load(true);
    // Auto-refresh every 30 seconds to reflect admin status changes
    intervalRef.current = setInterval(() => load(false), 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (loading) {
    return (
      <section className="orders-page">
        <div className="container">
          <div className="orders-state">Loading orders…</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="orders-page">
        <div className="container">
          <div className="orders-state orders-state--error">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <div className="container">
        <header className="orders-header">
          <div>
            <h1 className="page-title">My Orders</h1>
            <p className="page-subtitle">Track your recent purchases.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => load(false)}
              className="btn-outline"
              style={{ fontSize: '0.9rem' }}
            >
              ↻ Refresh
            </button>
            <Link to="/products" className="btn-outline">Continue Shopping</Link>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="orders-state">
            No orders yet. <Link to="/products">Browse products</Link>.
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-row">
                  <div>
                    <div className="order-title">Order #{String(order.id).slice(0, 8)}</div>
                    <div className="order-meta">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <StatusBadge status={order.status} />
                    <div className="order-total">
                      ETB {formatPrice(order.total)}
                    </div>
                  </div>
                </div>

                <div className="order-items">
                  {(order.items || []).slice(0, 3).map((it, idx) => (
                    <div key={idx} className="order-item">
                      <span className="order-item-name">{it.name}</span>
                      <span className="order-item-qty">x{it.quantity}</span>
                    </div>
                  ))}
                  {(order.items || []).length > 3 ? (
                    <div className="order-more">+{order.items.length - 3} more item(s)</div>
                  ) : null}
                </div>

                {order.user_confirmed ? (
                  <div className="order-feedback-display">
                    <div className="feedback-display-header">
                      <span className="feedback-confirmed-badge">✓ Received</span>
                      <div className="feedback-display-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <LuStar key={star} size={16} fill={order.rating >= star ? '#f59e0b' : 'none'} color={order.rating >= star ? '#f59e0b' : '#d1d5db'} />
                        ))}
                      </div>
                    </div>
                    {order.feedback && <p className="feedback-text">"{order.feedback}"</p>}
                  </div>
                ) : (
                  (order.status === 'shipped' || order.status === 'delivered') && (
                    <FeedbackForm order={order} onConfirmed={() => load(false)} />
                  )
                )}

                {!order.user_confirmed && order.status === 'delivered' && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(16,185,129,0.08)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#047857',
                    fontWeight: 600,
                  }}>
                    ✓ Your order has been marked delivered. Please confirm receipt above!
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Orders;