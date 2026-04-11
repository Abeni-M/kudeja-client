import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProductImageUrl } from '../utils/productImages';
import { formatPrice } from '../utils/formatters';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Your Cart</h1>
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    {item.imageUrl || item.image ? (
                      <img
                        src={item.imageUrl || getProductImageUrl(item.image)}
                        alt={item.name || 'Product'}
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <div className="item-price">{formatPrice(item.price)}</div>
                    <div className="item-quantity">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        disabled={item.stock !== undefined && item.stock !== null && item.stock !== '' ? item.quantity >= Number(item.stock) : false}
                        title={item.stock !== undefined && item.stock !== null && item.stock !== '' && item.quantity >= Number(item.stock) ? "Max stock reached" : ""}
                        style={{ opacity: item.stock !== undefined && item.stock !== null && item.stock !== '' && item.quantity >= Number(item.stock) ? 0.5 : 1, cursor: item.stock !== undefined && item.stock !== null && item.stock !== '' && item.quantity >= Number(item.stock) ? 'not-allowed' : 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="item-total">
                    {typeof item.priceNumber === 'number'
                      ? `ETB ${formatPrice(item.priceNumber * item.quantity)}`
                      : ''}
                  </div>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>ETB {formatPrice(cartTotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>ETB {formatPrice(cartTotal)}</span>
              </div>
              <button
                type="button"
                className="btn-primary checkout-btn"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;