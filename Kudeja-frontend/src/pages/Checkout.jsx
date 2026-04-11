import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderService';
import { formatPrice } from '../utils/formatters';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [shipping, setShipping] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    notes: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');

  const itemsPayload = useMemo(() => {
    return cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      priceNumber: item.priceNumber,
      priceDisplay: item.price,
      image: item.image,
      imageUrl: item.imageUrl,
    }));
  }, [cartItems]);

  const handleChange = (e) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }

    try {
      setSubmitting(true);
      await createOrder({
        items: itemsPayload,
        total: cartTotal,
        shippingAddress: shipping,
        paymentMethod,
      });
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="checkout-page">
      <div className="container checkout-grid">
        <div className="checkout-card">
          <h1 className="page-title">Checkout</h1>
          {error ? <div className="checkout-error">{error}</div> : null}

          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <div className="form-row">
              <label>Full name</label>
              <input
                name="fullName"
                value={shipping.fullName}
                onChange={handleChange}
                required
                placeholder="Your full name"
              />
            </div>
            <div className="form-row">
              <label>Phone</label>
              <input
                name="phone"
                value={shipping.phone}
                onChange={handleChange}
                required
                placeholder="+251 ..."
              />
            </div>
            <div className="form-row">
              <label>Address</label>
              <input
                name="addressLine1"
                value={shipping.addressLine1}
                onChange={handleChange}
                required
                placeholder="Street / building"
              />
            </div>
            <div className="form-row">
              <label>City</label>
              <input
                name="city"
                value={shipping.city}
                onChange={handleChange}
                required
                placeholder="Addis Ababa"
              />
            </div>
            <div className="form-row">
              <label>Notes (optional)</label>
              <textarea
                name="notes"
                value={shipping.notes}
                onChange={handleChange}
                rows={4}
                placeholder="Delivery instructions…"
              />
            </div>

            <div className="form-row">
              <label>Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >
                <option value="" disabled>Select your payment method</option>
                <optgroup label="Mobile Money">
                  <option value="CBE Birr">CBE Birr</option>
                  <option value="Telebirr">Telebirr</option>
                </optgroup>
                <optgroup label="Local Banks">
                  <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="Awash Bank">Awash Bank</option>
                  <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                </optgroup>
                <optgroup label="International">
                  <option value="MasterCard">MasterCard</option>
                  <option value="Visa">Visa</option>
                </optgroup>
              </select>
            </div>

            <div className="checkout-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Placing order…' : 'Place Order'}
              </button>
              <Link to="/cart" className="btn-outline">
                Back to Cart
              </Link>
            </div>
          </form>
        </div>

        <aside className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cartItems.length === 0 ? (
              <div className="summary-empty">
                Your cart is empty. <Link to="/products">Go shopping</Link>.
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <div className="summary-item-main">
                    <div className="summary-item-name">{item.name}</div>
                    <div className="summary-item-meta">
                      Qty {item.quantity} • {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="summary-item-total">
                    {typeof item.priceNumber === 'number'
                      ? `ETB ${formatPrice(item.priceNumber * item.quantity)}`
                      : ''}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="summary-totals">
              <span>Subtotal</span>
              <span>ETB {formatPrice(cartTotal)}</span>
            <div className="summary-row total">
              <span>Total</span>
              <span>ETB {formatPrice(cartTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;