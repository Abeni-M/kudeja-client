const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissions');
const path = require('path');
const fs = require('fs');
const { upload, getPublicUrl, uploadsDir } = require('./uploadRoutes');

// Target the frontend's images directory directly in local development (if present)
const frontendImagesDir = path.join(__dirname, '../../Kudeja-frontend/public/images');

// @route   POST /api/products/upload
// @desc    Upload product image locally and publicly
// @access  Private/Admin
router.post('/upload', protect, requirePermission('products:write'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const filename = req.file.filename;
    const url = getPublicUrl(req, filename);

    // If running alongside local frontend repo, also copy to frontend public/images for instant Vite sync
    try {
      if (fs.existsSync(frontendImagesDir)) {
        const dest = path.join(frontendImagesDir, filename);
        fs.copyFileSync(req.file.path, dest);
      }
    } catch (_) {}

    res.json({
      success: true,
      url,
      relativeUrl: `/uploads/${filename}`,
      public_id: filename,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: Category, as: 'categoryData', attributes: ['id', 'name'] }]
    });

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, as: 'categoryData', attributes: ['id', 'name'] }]
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin
router.post('/', protect, requirePermission('products:write'), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private/Admin
router.put('/:id', protect, requirePermission('products:write'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.update(req.body);
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add a review to a product
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const ratingInt = rating ? parseInt(rating, 10) : 0;
    if (ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let currentReviews = product.reviews;
    if (!currentReviews) {
      currentReviews = [];
    } else if (typeof currentReviews === 'string') {
      currentReviews = JSON.parse(currentReviews);
    }

    const alreadyReviewed = currentReviews.find(
      (r) => String(r.userId) === String(req.user.id)
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const newReview = {
      userId: req.user.id,
      userName: req.user.name || 'Anonymous',
      rating: ratingInt,
      comment: comment || '',
      date: new Date().toISOString()
    };

    const updatedReviews = [...currentReviews, newReview];
    await product.update({ reviews: updatedReviews });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private/Admin
router.delete('/:id', protect, requirePermission('products:write'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
