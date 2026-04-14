const express = require('express');
const router = express.Router();
const { Message, MessageReply, User, Product } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const { requirePermission, hasPermission } = require('../middleware/permissions');
const { getAIResponse } = require('../services/aiService');

// Custom middleware for optional authentication
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer')
        ? req.headers.authorization.split(' ')[1] : null;

    if (!token) return next();

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        next(); // Proceed as guest if token is invalid
    }
};

// @route   POST /api/messages
// @desc    Submit a contact form message (public or logged-in)
// @access  Public
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newMessage = await Message.create({ name, email, message, userId });

        // Socket emission to admin
        const io = req.app.get('io');
        if (io) {
            io.to('admin_room').emit('notification', {
                type: 'new_message',
                message: `New message from ${name}`,
                senderName: name,
                messageId: newMessage.id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: newMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while sending message',
            error: error.message
        });
    }
});

// @route   POST /api/messages/chat
// @desc    Live chat with AI bot and escalation
// @access  Private
router.post('/chat', protect, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        const name = req.user.username || req.user.name || 'User';
        const email = req.user.email;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // 1. Save User Message
        const userMsg = await Message.create({ 
            name, 
            email, 
            message, 
            userId,
            status: 'unescalated' 
        });

        // 2. Fetch Products and build Context for AI
        const products = await Product.findAll({ limit: 15, order: [['createdAt', 'DESC']] });
        const productContext = products.map(p => {
            const specsStr = p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join(', ') : 'No specs listed';
            const availability = p.stock > 0 ? 'AVAILABLE' : 'OUT';
            return `NAME: ${p.name} | ID: ${p.id} | CAT: ${p.category} | STOCK: ${availability} | PRICE: ${p.price} | SPECS: ${specsStr}`;
        }).join('\n');

        // 3. Get AI Response with Product awareness
        const { reply, escalate } = await getAIResponse(message, productContext);

        // 4. Save AI Reply
        const aiReply = await MessageReply.create({
            messageId: userMsg.id,
            userId: null,
            senderName: 'Kudeja AI',
            senderRole: 'admin',
            content: reply
        });

        // 4. Handle Escalation
        if (escalate) {
            await userMsg.update({ status: 'escalated' });
            
            // Socket emission to admin
            const io = req.app.get('io');
            if (io) {
                io.to('admin_room').emit('notification', {
                    type: 'chat_escalation',
                    message: `⚠️ Urgent: ${name} needs a human agent!`,
                    senderName: name,
                    messageId: userMsg.id
                });
            }
        }

        res.status(200).json({
            success: true,
            reply: reply,
            escalated: escalate,
            messageId: userMsg.id
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({ success: false, message: 'Bot communication failed' });
    }
});

// @route   GET /api/messages/my
// @desc    Get current user's messages
// @access  Private
router.get('/my', protect, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: { userId: req.user.id },
            include: [{
                model: MessageReply,
                as: 'replies',
                order: [['createdAt', 'ASC']]
            }],
            order: [['createdAt', 'DESC']]
        });

        // Reset chat history into "sessions" if there is a gap > 3 hours
        const SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000;
        let cutoffIndex = messages.length;
        
        // messages are ordered DESC (newest at index 0)
        for (let i = 0; i < messages.length - 1; i++) {
            const currentMsgDate = new Date(messages[i].createdAt); // newer
            const prevMsgDate = new Date(messages[i+1].createdAt);  // older
            
            if (currentMsgDate - prevMsgDate > SESSION_TIMEOUT_MS) {
                // Gap of more than 3 hours found!
                // Discard messages from i+1 onwards as they belong to an older session.
                cutoffIndex = i + 1;
                break;
            }
        }
        
        const activeSessionMessages = messages.slice(0, cutoffIndex);

        res.json({
            success: true,
            data: activeSessionMessages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your messages',
            error: error.message
        });
    }
});

// @route   GET /api/messages/unread-count
// @desc    Get count of unread messages for current user
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Message.count({
            where: {
                userId: req.user.id,
                isReadByUser: false
            }
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
});

// @route   PATCH /api/messages/mark-user-read
// @desc    Mark all messages as read by user
// @access  Private
router.patch('/mark-user-read', protect, async (req, res) => {
    try {
        await Message.update(
            { isReadByUser: true },
            { where: { userId: req.user.id, isReadByUser: false } }
        );

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read',
            error: error.message
        });
    }
});

// @route   GET /api/messages
// @desc    Get all messages
// @access  Private/Admin
router.get('/', protect, requirePermission('users:read'), async (req, res) => {
    try {
        const messages = await Message.findAll({
            include: [{
                model: MessageReply,
                as: 'replies',
                order: [['createdAt', 'ASC']]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
});

// @route   GET /api/messages/admin-unread-count
// @desc    Get count of unread messages for admin
// @access  Private/Admin
router.get('/admin-unread-count', protect, requirePermission('users:read'), async (req, res) => {
    try {
        const count = await Message.count({
            where: { status: 'unread' }
        });

        res.json({
            success: true,
            count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin unread count',
            error: error.message
        });
    }
});

// @route   PATCH /api/messages/:id/read
// @desc    Mark a message as read
// @access  Private/Admin
router.patch('/:id/read', protect, requirePermission('users:write'), async (req, res) => {
    try {
        const msg = await Message.findByPk(req.params.id);
        if (!msg) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await msg.update({ status: 'read' });

        res.json({
            success: true,
            data: msg
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update message',
            error: error.message
        });
    }
});

// @route   POST /api/messages/:id/reply
// @desc    Reply to a message (Admin or Message Owner)
// @access  Private
router.post('/:id/reply', protect, async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply) {
            return res.status(400).json({ success: false, message: 'Reply text is required' });
        }

        const msg = await Message.findByPk(req.params.id);
        if (!msg) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Check authorization: Must be staff with write permission OR the owner of the message
        const isStaffAgent = hasPermission(req.user, 'messages:write');
        const isOwner = msg.userId === req.user.id;
        
        if (!isStaffAgent && !isOwner) {
            return res.status(403).json({ success: false, message: 'Not authorized to reply to this message' });
        }

        const newReply = await MessageReply.create({
            messageId: msg.id,
            userId: req.user.id,
            senderName: req.user.username || req.user.name || (isStaffAgent ? 'Staff' : 'User'),
            senderRole: isStaffAgent ? 'admin' : 'user',
            content: reply
        });

        // Update main message status
        await msg.update({
            status: isStaffAgent ? 'replied' : 'unread', 
            isReadByUser: isStaffAgent ? false : true
        });

        // Socket emission
        const io = req.app.get('io');
        if (io) {
            if (isStaffAgent) {
                io.to(`user_${msg.userId}`).emit('notification', {
                    type: 'new_reply',
                    message: 'Staff replied to your message',
                    messageId: msg.id
                });
            } else {
                io.to('admin_room').emit('notification', {
                    type: 'new_reply',
                    message: `Reply from ${req.user.username || req.user.name}`,
                    messageId: msg.id
                });
            }
        }

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: newReply
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send reply',
            error: error.message
        });
    }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private/Admin
router.delete('/:id', protect, requirePermission('users:write'), async (req, res) => {
    try {
        const msg = await Message.findByPk(req.params.id);
        if (!msg) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await msg.destroy();

        res.json({
            success: true,
            message: 'Message deleted'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
});

module.exports = router;
