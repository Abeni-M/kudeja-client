// kudeja-backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const { sequelize, Product, Category, Message, MessageReply, Notification } = require('./models');

// Associations are structured in models/index.js now.
// For safety, we keep them here if needed, but index.js is the source of truth.

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174', // current dev server
      'http://localhost:3000',
    ],
    credentials: true,
  })
);
app.use(express.json());

// Create HTTP server
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined their notification room`);
  });

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log('🛡️ Admin joined the admin notification room');
  });

  socket.on('chat_message', (data) => {
    const { targetUserId, message, senderName, messageId, isAdmin } = data;
    if (isAdmin) {
      // Send to specific user
      socket.to(`user_${targetUserId}`).emit('chat_message', data);
    } else {
      // Send to all admins
      socket.to('admin_room').emit('chat_message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userAdminRoutes = require('./routes/userAdminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adRoutes = require('./routes/adRoutes');
const taskRoutes = require('./routes/taskRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/users', userAdminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payments', paymentRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Kudeja Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
    },
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    uptime: process.uptime(),
  });
});

app.get('/api/health/ai', (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    const hasKey = key && key !== 'your_gemini_api_key_here';
    res.json({
        geminiActive: hasKey,
        keyFormat: hasKey ? (key.startsWith('AQ') ? 'New (AQ)' : 'Legacy (AIza)') : 'None',
        botName: 'Kudeja AI Assistant'
    });
});

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced and altered');
    
    // Gemini AI Startup Check
    const { getAIResponse } = require('./services/aiService');
    const testKey = process.env.GEMINI_API_KEY;
    if (testKey && testKey !== 'your_gemini_api_key_here') {
      console.log('🤖 Gemini AI: Checking connectivity...');
      getAIResponse('Hello', '')
        .then(() => console.log('✅ Gemini AI: Connection Successful!'))
        .catch(err => {
            console.error('❌ Gemini AI: Connection Failed:', err.message);
            if (err.message.includes('API_KEY_INVALID')) {
                console.error('   -> Suggestion: Your API key appears invalid. Check your .env file.');
            }
        });
    } else {
      console.log('⚠️ Gemini AI: No valid API Key found. System will use Keyword matching.');
    }
  } catch (error) {
    console.error('❌ Database startup error:', error.message);
  }

  server.listen(PORT, () => {
    console.log(`✅ Backend running at: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

start();
