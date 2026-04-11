const express = require('express');
const router = express.Router();
const { Product, Category } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissions');
const multer = require('multer');
const path = require('path');

// Target the frontend's images directory directly
const frontendImagesDir = path.join(__dirname, '../../Kudeja-frontend/public/images');

// Configure Multer for local disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, frontendImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// @route   POST /api/products/upload
// @desc    Upload product image locally
// @access  Private/Admin
router.post('/upload', protect, requirePermission('products:write'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // The frontend Vite server hosts /images automatically from its public folder.
    const url = `/images/${req.file.filename}`;
    res.json({ success: true, url, public_id: req.file.filename });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
  }
});


// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Add pagination
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

    // Prepare current reviews array
    let currentReviews = product.reviews;
    if (!currentReviews) {
      currentReviews = [];
    } else if (typeof currentReviews === 'string') {
      currentReviews = JSON.parse(currentReviews);
    }

    // Check if user already reviewed
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

    // Crucial: Must create a totally new array reference for Sequelize to execute the UPDATE query on JSON/JSONB
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