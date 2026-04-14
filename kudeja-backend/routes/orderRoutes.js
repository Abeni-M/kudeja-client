const express = require('express');
const router = express.Router();

const { Order, Notification, Product } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissions');
const { sendOrderReceipt, sendAdminAlert } = require('../utils/emailService');

// @route   GET /api/orders
// @desc    List orders for current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const isStaff = ['admin', 'sub-admin', 'sales'].includes(req.user?.role);
    const wantsAll = String(req.query.all || '').toLowerCase() === 'true';

    const where = isStaff && wantsAll ? undefined : { user_id: req.user.id };

    const orders = await Order.findAll({
      ...(where ? { where } : {}),
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/orders
// @desc    Create an order from cart items
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, total, shippingAddress, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    // 1. Validate stock first
    for (const item of items) {
      const product = await Product.findByPk(item.id || item._id);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.name || item.id} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }
    }

    const totalNumber = typeof total === 'number' ? total : Number.parseFloat(total);
    if (!Number.isFinite(totalNumber) || totalNumber < 0) {
      return res.status(400).json({ success: false, message: 'Valid total is required' });
    }

    // 2. Create the order
    const order = await Order.create({
      user_id: req.user.id,
      items,
      total: totalNumber,
      shipping_address: shippingAddress || null,
      payment_method: paymentMethod || 'Cash on Delivery',
      status: 'pending',
    });

    // 3. Deduct stock and notify if finished
    for (const item of items) {
      const product = await Product.findByPk(item.id || item._id);
      const newStock = Math.max(0, product.stock - (item.quantity || 1));
      await product.update({ stock: newStock });

      if (newStock === 0) {
        await Notification.create({
          message: `⚠️ STOCK FINISHED: ${product.name} is now out of stock!`,
          type: 'error',
          targetId: product.id
        });
      }
    }

    // Create Notification for Admin about the new order
    await Notification.create({
      message: `New order #${String(order.id).slice(0, 8)} was placed`,
      type: 'info',
      targetId: order.id
    });

    // Send emails (these run asynchronously without completely blocking the response)
    sendOrderReceipt(req.user.email, {
      id: order.id,
      items,
      total: totalNumber,
      status: order.status,
      paymentMethod: order.payment_method,
      shippingAddress,
    });
    
    sendAdminAlert({
      id: order.id,
      total: totalNumber,
      paymentMethod: order.payment_method
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PATCH /api/orders/:id/confirm
// @desc    Confirm receipt and leave feedback
// @access  Private
router.patch('/:id/confirm', protect, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    // Only allow 1-5 rating if provided
    const ratingInt = rating ? parseInt(rating, 10) : null;
    if (ratingInt && (ratingInt < 1 || ratingInt > 5)) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user_confirmed) {
      return res.status(400).json({ success: false, message: 'Order is already confirmed' });
    }

    await order.update({
      user_confirmed: true,
      status: 'delivered', // Force status to delivered upon receipt
      rating: ratingInt,
      feedback: feedback || null,
    });

    // Create Notification for Admin
    await Notification.create({
      message: `Customer received Order #${String(order.id).slice(0, 8)} and left ${order.rating} stars`,
      type: 'success',
      targetId: order.id
    });

    return res.json({ success: true, message: 'Order confirmed and feedback saved', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.patch('/:id/status', protect, requirePermission('orders:write'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.update({ status });

    // Create Notification for Admin
    let type = 'info';
    if (status === 'paid' || status === 'delivered') type = 'success';
    if (status === 'shipped') type = 'warning';
    if (status === 'cancelled') type = 'error';

    await Notification.create({
      message: `Order #${String(order.id).slice(0, 8)} status changed to ${status}`,
      type,
      targetId: order.id
    });
    return res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private/Admin
router.delete('/:id', protect, requirePermission('orders:write'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.destroy();
    return res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
