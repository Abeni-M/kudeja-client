const express = require('express');
const router = express.Router();
const { Category } = require('../models');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a category
router.post('/', async (req, res) => {
    try {
        const { name, description, specFields } = req.body;
        const category = await Category.create({ name, description, specFields });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Update a category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, specFields } = req.body;
        const category = await Category.findByPk(id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

        await category.update({ name, description, specFields });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByPk(id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        await category.destroy();
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
