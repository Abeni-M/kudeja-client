const express = require('express');
const router = express.Router();
const { Ad } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissions');

// Helper to ensure slideImages is saved as JSON string in text column
function formatSlideImages(val) {
  if (val === undefined || val === null) return '[]';
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

// @desc    Get all active ads (public)
// @route   GET /api/ads
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.findAll({ where: { isActive: true } });
    res.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Get all ads including inactive (admin)
// @route   GET /api/ads/all
router.get('/all', protect, async (req, res) => {
  try {
    const ads = await Ad.findAll({ order: [['createdAt', 'DESC']] });
    res.json(ads);
  } catch (error) {
    console.error('Error fetching all ads:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Create an ad
// @route   POST /api/ads
router.post('/', protect, requirePermission('ads:write'), async (req, res) => {
  try {
    const { companyName, address, image, isActive, description, website, phone, email, slideImages, slideInterval, placement } = req.body;
    
    if (!companyName || !image) {
      return res.status(400).json({ message: 'Company name and image are required' });
    }

    const ad = await Ad.create({
      companyName,
      address: address || 'N/A',
      image,
      isActive: isActive !== undefined ? isActive : true,
      description: description || null,
      website: website || null,
      phone: phone || null,
      email: email || null,
      slideImages: formatSlideImages(slideImages),
      slideInterval: Number(slideInterval) || 5,
      placement: placement || 'sidebar',
    });
    res.status(201).json(ad);
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(400).json({ message: error.message || 'Invalid ad data' });
  }
});

// @desc    Update ad
// @route   PUT /api/ads/:id
router.put('/:id', protect, requirePermission('ads:write'), async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    await ad.update({
      companyName: req.body.companyName !== undefined ? req.body.companyName : ad.companyName,
      address: req.body.address !== undefined ? req.body.address : ad.address,
      image: req.body.image !== undefined ? req.body.image : ad.image,
      isActive: req.body.isActive !== undefined ? req.body.isActive : ad.isActive,
      description: req.body.description !== undefined ? req.body.description : ad.description,
      website: req.body.website !== undefined ? req.body.website : ad.website,
      phone: req.body.phone !== undefined ? req.body.phone : ad.phone,
      email: req.body.email !== undefined ? req.body.email : ad.email,
      slideImages: req.body.slideImages !== undefined ? formatSlideImages(req.body.slideImages) : ad.slideImages,
      slideInterval: req.body.slideInterval !== undefined ? Number(req.body.slideInterval) : ad.slideInterval,
      placement: req.body.placement !== undefined ? req.body.placement : ad.placement,
    });

    res.json(ad);
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(400).json({ message: error.message || 'Invalid data' });
  }
});

// @desc    Delete ad
// @route   DELETE /api/ads/:id
router.delete('/:id', protect, requirePermission('ads:write'), async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    await ad.destroy();
    res.json({ message: 'Ad removed' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;
