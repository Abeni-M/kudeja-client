const express = require('express');
const router = express.Router();
const { Ad } = require('../models');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get all active ads (public)
// @route   GET /api/ads
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.findAll({ where: { isActive: true } });
    res.json(ads);
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all ads including inactive (admin)
// @route   GET /api/ads/all
router.get('/all', protect, admin, async (req, res) => {
  try {
    const ads = await Ad.findAll();
    res.json(ads);
  } catch (error) {
    console.error('Error fetching all ads:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Create an ad
// @route   POST /api/ads
router.post('/', protect, admin, async (req, res) => {
  try {
    const { companyName, address, image, isActive, description, website, phone, email, slideImages, slideInterval, placement } = req.body;
    const ad = await Ad.create({ companyName, address, image, isActive, description, website, phone, email, slideImages, slideInterval, placement });
    res.status(201).json(ad);
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(400).json({ message: 'Invalid ad data' });
  }
});

// @desc    Update ad
// @route   PUT /api/ads/:id
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    await ad.update({
      companyName: req.body.companyName || ad.companyName,
      address: req.body.address || ad.address,
      image: req.body.image || ad.image,
      isActive: req.body.isActive !== undefined ? req.body.isActive : ad.isActive,
      description: req.body.description !== undefined ? req.body.description : ad.description,
      website: req.body.website !== undefined ? req.body.website : ad.website,
      phone: req.body.phone !== undefined ? req.body.phone : ad.phone,
      email: req.body.email !== undefined ? req.body.email : ad.email,
      slideImages: req.body.slideImages !== undefined ? req.body.slideImages : ad.slideImages,
      slideInterval: req.body.slideInterval !== undefined ? req.body.slideInterval : ad.slideInterval,
      placement: req.body.placement !== undefined ? req.body.placement : ad.placement,
    });

    res.json(ad);
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(400).json({ message: 'Invalid data' });
  }
});

// @desc    Delete ad
// @route   DELETE /api/ads/:id
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    if (!ad) return res.status(404).json({ message: 'Ad not found' });

    await ad.destroy();
    res.json({ message: 'Ad removed' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
