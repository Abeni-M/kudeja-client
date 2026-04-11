const express = require('express');
const router = express.Router();
const { Task } = require('../models');
const { protect } = require('../middleware/authMiddleware');

// Get all tasks for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.findAll({ where: { user_id: req.user.id } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a task
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, status, priority, due_date } = req.body;
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      due_date,
      user_id: req.user.id,
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const { title, description, status, priority, due_date } = req.body;
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await task.update({ title, description, status, priority, due_date });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await task.destroy();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;