import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orderService';
import { initializePayment } from '../services/paymentService';
import { formatPrice } from '../utils/formatters';
import PaymentMethods from '../components/PaymentMethods';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
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
      setLoadingStep('Creating your order...');
      const orderResponse = await createOrder({
        items: itemsPayload,
        total: cartTotal,
        shippingAddress: shipping,
        paymentMethod,
      });

      const orderId = orderResponse.data.data.id;

      // 3. Initialize Payment (Real logic simulation)
      const redirectMethods = ['Telebirr', 'CBE Birr', 'Visa', 'Mastercard', 'PayPal', 'CBE Bank', 'Awash Bank', 'Abyssinia'];
      if (redirectMethods.includes(paymentMethod)) {
        setLoadingStep(`Connecting to ${paymentMethod} Secure Gateway...`);
        const paymentResponse = await initializePayment({
          amount: cartTotal,
          tx_ref: orderId,
          email: user?.email || 'customer@kudeja.com',
          first_name: user?.name?.split(' ')[0] || shipping.fullName.split(' ')[0],
          last_name: user?.name?.split(' ')[1] || shipping.fullName.split(' ')[1] || 'Customer',
          payment_method: paymentMethod
        });

        if (paymentResponse.data.success) {
          // REDIRECT TO CHAPA CHECKOUT
          window.location.href = paymentResponse.data.data.checkout_url;
          return;
        }
      }

      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to place order');
    } finally {
      // Keep submitting true if we are redirecting, otherwise hide overlay
      const isRedirectMethod = ['Telebirr', 'CBE Birr', 'Visa', 'Mastercard', 'PayPal', 'CBE Bank', 'Awash Bank', 'Abyssinia'].includes(paymentMethod);
      if (!isRedirectMethod) {
         setSubmitting(false);
      }
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
              <PaymentMethods 
                selectedMethod={paymentMethod} 
                onSelect={setPaymentMethod} 
              />
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

      {submitting && (
        <div className="payment-overlay">
          <div className="payment-modal">
            <div className="spinner"></div>
            <h2>Securely Processing</h2>
            <p>{loadingStep || 'Please do not close this window...'}</p>
            <div className="secure-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>SSL Secured Payment</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Checkout;