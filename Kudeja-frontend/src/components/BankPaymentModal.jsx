import React, { useState, useRef } from 'react';
import { LuCopy, LuCheck, LuUpload, LuX, LuImage, LuShieldCheck, LuCircleAlert, LuTrash2, LuLoader } from 'react-icons/lu';
import { formatPrice } from '../utils/formatters';
import { uploadFile } from '../services/uploadService';
import toast from 'react-hot-toast';
import './BankPaymentModal.css';

// Import logos
import telebirrLogo from '../images/telebirr.png';
import cbeBirrLogo from '../images/cbce birr.png';
import cbeLogo from '../images/cbe.png';
import awashLogo from '../images/awash.png';
import abyssiniaLogo from '../images/abysinnia.png';
import visaLogo from '../images/visa.png';
import paypalLogo from '../images/paypal.png';

export const BANK_ACCOUNTS = {
  'Telebirr': {
    name: 'Telebirr',
    logo: telebirrLogo,
    type: 'Mobile Money',
    accountNumber: '0911 23 45 67',
    accountName: 'Kudeja Trading PLC',
    merchantCode: '884210',
    instruction: 'Open your Telebirr App, send money to the phone or merchant code below, and upload the transfer receipt screenshot.',
  },
  'CBE Birr': {
    name: 'CBE Birr',
    logo: cbeBirrLogo,
    type: 'Mobile Money',
    accountNumber: '0911 23 45 67',
    accountName: 'Kudeja Trading PLC',
    instruction: 'Open CBE Birr app or dial *847#, complete the transfer, and upload the confirmation screenshot or receipt.',
  },
  'CBE Bank': {
    name: 'Commercial Bank of Ethiopia (CBE)',
    logo: cbeLogo,
    type: 'Bank Transfer',
    accountNumber: '1000 4821 95421',
    accountName: 'Kudeja Trading PLC',
    branch: 'Addis Ababa Central Branch',
    instruction: 'Transfer via CBE Mobile Banking, Internet Banking, or in-branch deposit, and upload your payment confirmation receipt.',
  },
  'Awash Bank': {
    name: 'Awash Bank',
    logo: awashLogo,
    type: 'Bank Transfer',
    accountNumber: '0130 4821 95400',
    accountName: 'Kudeja Trading PLC',
    branch: 'Bole Branch, Addis Ababa',
    instruction: 'Transfer via Awash Online / Mobile App or branch deposit, and upload a screenshot of the completed transfer.',
  },
  'Abyssinia': {
    name: 'Bank of Abyssinia',
    logo: abyssiniaLogo,
    type: 'Bank Transfer',
    accountNumber: '1842 5901 24',
    accountName: 'Kudeja Trading PLC',
    instruction: 'Transfer using BoA Mobile App or direct deposit, and upload the confirmation slip below.',
  },
  'Visa': {
    name: 'Visa Card / International Transfer',
    logo: visaLogo,
    type: 'Card & International Banking',
    accountNumber: '1000 4821 95421',
    accountName: 'Kudeja Trading PLC (Foreign Currency)',
    swiftCode: 'CBETETAA',
    instruction: 'Transfer via international wire or Visa transfer and attach your bank debit receipt below.',
  },
  'Mastercard': {
    name: 'Mastercard / Wire Transfer',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png',
    type: 'Card & International Banking',
    accountNumber: '1000 4821 95421',
    accountName: 'Kudeja Trading PLC (Foreign Currency)',
    swiftCode: 'CBETETAA',
    instruction: 'Transfer via Mastercard or international wire and attach your confirmation receipt below.',
  },
  'PayPal': {
    name: 'PayPal',
    logo: paypalLogo,
    type: 'International Digital Wallet',
    accountNumber: 'payment@kudeja.com',
    accountName: 'Kudeja Trading PLC',
    instruction: 'Send the total amount to payment@kudeja.com on PayPal and upload a screenshot of the confirmation page.',
  },
};

export default function BankPaymentModal({
  isOpen,
  onClose,
  paymentMethod,
  cartTotal,
  onConfirmOrder,
  isSubmitting,
}) {
  const [copied, setCopied] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const uploadPromiseRef = useRef(null);

  if (!isOpen) return null;

  const bank = BANK_ACCOUNTS[paymentMethod] || {
    name: paymentMethod,
    type: 'Bank Transfer',
    accountNumber: '1000 4821 95421',
    accountName: 'Kudeja Trading PLC',
    instruction: 'Please transfer the order total to the account below and upload your transfer screenshot.',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bank.accountNumber.replace(/\s+/g, ''));
    setCopied(true);
    toast.success('Account number copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileProcess = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size must be under 15MB.');
      return;
    }

    setReceiptFileName(file.name);

    // 1. Instant local preview for zero-delay visual feedback
    const localUrl = URL.createObjectURL(file);
    setReceiptPreview(localUrl);

    // 2. Automatically upload directly to the server
    setIsUploading(true);
    const p = uploadFile(file, 'receipt')
      .then((res) => {
        const publicUrl = res.url || res.data?.url || res.relativeUrl;
        setUploadedReceiptUrl(publicUrl);
        setIsUploading(false);
        toast.success('Transfer screenshot uploaded!');
        return publicUrl;
      })
      .catch((err) => {
        console.warn('Server upload fallback to data URL:', err);
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            setUploadedReceiptUrl(dataUrl);
            setIsUploading(false);
            resolve(dataUrl);
          };
          reader.readAsDataURL(file);
        });
      });

    uploadPromiseRef.current = p;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptPreview && !uploadedReceiptUrl) {
      toast.error('Please upload a screenshot of your transfer confirmation.');
      return;
    }

    let finalReceiptUrl = uploadedReceiptUrl;
    if (isUploading && uploadPromiseRef.current) {
      const toastId = toast.loading('Finishing screenshot upload...');
      try {
        finalReceiptUrl = await uploadPromiseRef.current;
        toast.dismiss(toastId);
      } catch (_) {
        toast.dismiss(toastId);
      }
    }

    if (!finalReceiptUrl) {
      finalReceiptUrl = receiptPreview;
    }

    onConfirmOrder({
      paymentMethod,
      paymentReceipt: finalReceiptUrl,
      transactionRef,
    });
  };

  return (
    <div className="bank-modal-overlay" onClick={onClose}>
      <div className="bank-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bank-modal-header">
          <div className="bank-modal-header-left">
            {bank.logo && (
              <img src={bank.logo} alt={bank.name} className="bank-modal-logo" />
            )}
            <div>
              <h2 className="bank-modal-title">{bank.name}</h2>
              <span className="bank-modal-badge">{bank.type}</span>
            </div>
          </div>
          <button className="bank-modal-close" onClick={onClose} aria-label="Close">
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bank-modal-body">
          {/* Amount to pay banner */}
          <div className="bank-amount-banner">
            <span className="bank-amount-label">Total Amount to Pay:</span>
            <span className="bank-amount-value">ETB {formatPrice(cartTotal)}</span>
          </div>

          {/* Account Details Box */}
          <div className="bank-details-box">
            <div className="bank-details-row">
              <span className="bank-details-label">Account Holder:</span>
              <span className="bank-details-val bank-account-name">{bank.accountName}</span>
            </div>

            <div className="bank-details-row highlight-row">
              <div>
                <span className="bank-details-label">
                  {bank.name === 'PayPal' ? 'PayPal Email:' : 'Account / Phone Number:'}
                </span>
                <div className="bank-account-num-display">{bank.accountNumber}</div>
              </div>
              <button
                type="button"
                className={`bank-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy account number"
              >
                {copied ? <LuCheck size={16} /> : <LuCopy size={16} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {bank.branch && (
              <div className="bank-details-row">
                <span className="bank-details-label">Branch:</span>
                <span className="bank-details-val">{bank.branch}</span>
              </div>
            )}

            {bank.swiftCode && (
              <div className="bank-details-row">
                <span className="bank-details-label">SWIFT Code:</span>
                <span className="bank-details-val">{bank.swiftCode}</span>
              </div>
            )}
          </div>

          <div className="bank-instruction-hint">
            <LuCircleAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <p>{bank.instruction}</p>
          </div>

          {/* Upload Screenshot Box */}
          <div className="bank-upload-section">
            <label className="bank-upload-title">
              Upload Transfer Screenshot / Receipt <span className="required-star">*</span>
            </label>

            {receiptPreview ? (
              <div className="bank-receipt-preview">
                <img src={receiptPreview} alt="Payment Receipt" />
                <div className="bank-receipt-meta">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="bank-receipt-filename">{receiptFileName || 'receipt_screenshot.png'}</span>
                    {isUploading ? (
                      <span style={{ fontSize: '0.75rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LuLoader size={12} className="spin-icon" /> Uploading to secure server...
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LuCheck size={12} /> Ready to submit
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="bank-remove-receipt-btn"
                    onClick={() => {
                      setReceiptPreview(null);
                      setUploadedReceiptUrl('');
                      setReceiptFileName('');
                    }}
                  >
                    <LuTrash2 size={14} /> Remove &amp; Re-upload
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`bank-dropzone ${isDragOver ? 'dragover' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bank-dropzone-icon">
                  <LuUpload size={28} />
                </div>
                <p className="bank-dropzone-main">
                  <strong>Click to choose from desktop</strong> or drag and drop screenshot here
                </p>
                <p className="bank-dropzone-sub">Supports PNG, JPG, JPEG, WEBP (Max 15MB)</p>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileProcess(file);
              }}
            />
          </div>

          {/* Transaction Ref / Note (Optional) */}
          <div className="bank-form-group">
            <label>Transaction Reference / SMS Code (Optional)</label>
            <input
              type="text"
              placeholder="e.g. FT2610XXXXXX, Telebirr Txn ID"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="bank-input"
            />
          </div>

          {/* Actions */}
          <div className="bank-modal-actions">
            <button
              type="submit"
              className="bank-submit-btn"
              disabled={isSubmitting || isUploading || !receiptPreview}
            >
              <LuShieldCheck size={18} />
              {isSubmitting ? 'Submitting Order…' : isUploading ? 'Uploading Screenshot…' : 'Confirm Payment & Place Order'}
            </button>
            <button
              type="button"
              className="bank-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Choose Another Method
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
