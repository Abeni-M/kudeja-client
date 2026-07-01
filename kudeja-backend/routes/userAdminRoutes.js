const express = require('express');
const router = express.Router();

const { User, Order, Product, Notification } = require('../models');
const { protect, admin } = require('../middleware/authMiddleware');
const { requirePermission, hasPermission } = require('../middleware/permissions');

function sanitizeUser(user) {
  if (!user) return null;
  return user.toJSON ? user.toJSON() : user;
}

// GET /api/admin/users?page=&limit=
router.get('/', protect, requirePermission('users:read'), async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const { count, rows } = await User.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows.map(sanitizeUser),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/admin/users/:id
router.get('/:id', protect, requirePermission('users:read'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PATCH /api/admin/users/:id/role  { role: 'user' | 'admin' }
router.patch('/:id/role', protect, requirePermission('users:write'), async (req, res) => {
  try {
    const { role } = req.body || {};
    if (!['user', 'admin', 'sales', 'sub-admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Prevent self-demotion to avoid locking out admin access.
    if (String(req.user.id) === String(req.params.id) && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin role' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.update({ role });
    return res.json({ success: true, message: 'Role updated', data: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PATCH /api/admin/users/:id/status  { isActive: boolean }
router.patch('/:id/status', protect, requirePermission('users:write'), async (req, res) => {
  try {
    const { isActive } = req.body || {};
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be boolean' });
    }

    // Prevent deactivating your own account.
    if (String(req.user.id) === String(req.params.id) && isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.update({ isActive });
    return res.json({ success: true, message: 'Status updated', data: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/admin/users/stats
router.get('/dashboard/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const allProducts = await Product.findAll();
    const totalProducts = allProducts.length;
    const allOrders = await Order.findAll();
    const totalOrders = allOrders.length;

    // Calculate total revenue
    let totalRevenue = 0;
    if (hasPermission(req.user, 'revenue:read')) {
      totalRevenue = allOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    }

    // Calculate orders by status
    const ordersByStatus = allOrders.reduce((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const ordersByStatusArray = Object.keys(ordersByStatus).map(name => ({
      name, value: ordersByStatus[name]
    }));

    // Calculate top categories
    const categoriesCount = allProducts.reduce((acc, prod) => {
      const cat = prod.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.keys(categoriesCount)
      .map(name => ({ name, value: categoriesCount[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Calculate activity by day (orders only) for the last 7 days
    const activityByDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const shortDate = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayOrders = allOrders.filter(o => {
        if (!o.createdAt) return false;
        return new Date(o.createdAt).toISOString().split('T')[0] === dateStr;
      });
        
      activityByDay.push({
        date: shortDate,
        fullDate: dateStr,
        orders: dayOrders.length
      });
    }

    // Fetch real notifications from the Notification model
    const newestNotifications = await Notification.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    const notifications = newestNotifications.map(n => ({
      id: n.id,
      message: n.message,
      type: n.type,
      time: new Date(n.createdAt).toLocaleString()
    }));

    // Identify low stock products (less than 10)
    const lowStockProducts = allProducts
      .filter(p => p.stock !== null && p.stock <= 10)
      .map(p => ({ id: p.id, name: p.name, stock: p.stock }))
      .slice(0, 10);

    return res.json({
      success: true,
      data: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        revenue: totalRevenue,
        growth: 12,
        notifications: notifications,
        activityByDay,
        ordersByStatus: ordersByStatusArray,
        topCategories,
        lowStockProducts
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/admin/users/notifications/clear
// @desc    Delete all notifications permanently
router.delete('/dashboard/notifications/clear', protect, requirePermission('users:write'), async (req, res) => {
    try {
        await Notification.destroy({ where: {}, truncate: true });
        res.json({ success: true, message: 'All notifications deleted permanently' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to clear notifications' });
    }
});

// DELETE /api/admin/users/notifications/:id
// @desc    Delete a specific notification permanently
router.delete('/dashboard/notifications/:id', protect, requirePermission('users:write'), async (req, res) => {
    try {
        await Notification.destroy({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Notification deleted permanently' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
});

module.exports = router;

