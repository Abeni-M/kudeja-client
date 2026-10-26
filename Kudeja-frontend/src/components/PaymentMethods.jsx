import React from 'react';
import './PaymentMethods.css';

// Import local images
import telebirrLogo from '../images/telebirr.png';
import cbeBirrLogo from '../images/cbce birr.png';
import cbeLogo from '../images/cbe.png';
import awashLogo from '../images/awash.png';
import abyssiniaLogo from '../images/abysinnia.png';
import visaLogo from '../images/visa.png';
import paypalLogo from '../images/paypal.png';

const PAYMENT_METHODS = [
  {
    id: 'telebirr',
    name: 'Telebirr',
    logo: telebirrLogo,
    type: 'Mobile Money',
    popular: true
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr',
    logo: cbeBirrLogo,
    type: 'Mobile Money'
  },
  {
    id: 'cbe',
    name: 'CBE Bank',
    logo: cbeLogo,
    type: 'Bank'
  },
  {
    id: 'awash',
    name: 'Awash Bank',
    logo: awashLogo,
    type: 'Bank'
  },
  {
    id: 'abyssinia',
    name: 'Abyssinia',
    logo: abyssiniaLogo,
    type: 'Bank'
  },
  {
    id: 'visa',
    name: 'Visa',
    logo: visaLogo,
    type: 'Card'
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png',
    type: 'Card'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    logo: paypalLogo,
    type: 'International'
  }
];

const PaymentMethods = ({ selectedMethod, onSelect, hasReceipt, onOpenModal }) => {
  return (
    <div className="payment-methods-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 className="section-subtitle" style={{ margin: 0 }}>Select Payment Method</h3>
        {selectedMethod && (
          <button
            type="button"
            onClick={() => onOpenModal && onOpenModal(selectedMethod)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary, #d11b1b)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {hasReceipt ? '✓ Screenshot attached (Click to view account)' : 'Click to view account number & transfer details'}
          </button>
        )}
      </div>

      <div className="payment-methods-grid">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.name;
          return (
            <div
              key={method.id}
              className={`payment-method-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect(method.name)}
              title="Click to view bank account number and upload transfer screenshot"
            >
              {method.popular && <span className="payment-badge">Popular</span>}
              {isSelected && hasReceipt && (
                <span className="payment-badge" style={{ background: '#10b981', color: '#fff' }}>✓ Receipt</span>
              )}
              <img src={method.logo} alt={method.name} className="payment-logo" />
              <span className="payment-name">{method.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethods;
