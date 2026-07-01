const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { Order, Notification } = require('../models');
const { Chapa } = require('chapa-nodejs');

const chapa = new Chapa({
  secretKey: process.env.CHAPA_SECRET_KEY,
});

// @route   POST /api/payments/initialize
// @desc    Initialize a payment (Chapa integration placeholder)
// @access  Private
router.post('/initialize', protect, async (req, res) => {
  try {
    const { amount, currency, email, first_name, last_name, tx_ref } = req.body;

    const response = await chapa.initialize({
      first_name,
      last_name,
      email,
      currency: currency || 'ETB',
      amount: String(amount),
      tx_ref: String(tx_ref),
      callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/orders`,
      customization: {
        title: 'Kudeja Payment',
        description: `Payment for Order #${tx_ref}`,
      },
    });

    if (response.status === 'success') {
      res.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          checkout_url: response.data.checkout_url,
          tx_ref: tx_ref
        }
      });
    } else {
      throw new Error(response.message || 'Chapa initialization failed');
    }
  } catch (error) {
    console.error('Chapa Init Error:', error);
    res.status(500).json({ success: false, message: 'Payment initialization failed', error: error.message });
  }
});

// @route   GET /api/payments/verify/:tx_ref
// @desc    Verify payment status
// @access  Private
router.get('/verify/:tx_ref', protect, async (req, res) => {
  try {
    const { tx_ref } = req.params;

    const response = await chapa.verify({ tx_ref });
    
    if (response.status === 'success') {
      const order = await Order.findOne({ where: { id: tx_ref } });
      if (order && order.status !== 'paid') {
        await order.update({ status: 'paid' });
        
        await Notification.create({
          message: `Payment verified for Order #${tx_ref.slice(0,8)}. Status updated to PAID.`,
          type: 'success',
          targetId: order.id
        });
      }

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        data: response.data
      });
    } else {
      return res.status(400).json({ success: false, message: 'Payment verification failed', data: response });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification error', error: error.message });
  }
});

// @route   POST /api/payments/webhook
// @desc    Chapa payment webhook
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const { tx_ref, status } = req.body;

    // Verify webhook signature in production!
    // const hash = crypto.createHmac('sha256', process.env.CHAPA_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    
    if (status === 'success') {
      const order = await Order.findOne({ where: { id: tx_ref } });
      if (order && order.status !== 'paid') {
        await order.update({ status: 'paid' });
        
        await Notification.create({
          message: `Payment confirmed for Order #${tx_ref.slice(0,8)} via Webhook.`,
          type: 'success',
          targetId: order.id
        });
      }
    }

    res.status(200).send('Webhook Received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Webhook Error');
  }
});

module.exports = router;
