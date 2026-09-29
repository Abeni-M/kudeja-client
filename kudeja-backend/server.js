// kudeja-backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// Safety loggers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;
const { sequelize, User } = require('./models');

// Allowed Origins for CORS
const ALLOWED_ORIGIN = [
  'https://market.kudeja.et',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

// CORS Middleware (Must be before routes)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGIN.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in dev/prod for specified domain
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Create HTTP server
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
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
    const { targetUserId, message, isAdmin } = data;
    if (isAdmin) {
      socket.to(`user_${targetUserId}`).emit('chat_message', data);
    } else {
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

// Use routes (supporting both /api/v1 and /api)
app.use(['/api/v1/auth', '/api/auth'], authRoutes);
app.use(['/api/v1/products', '/api/products'], productRoutes);
app.use(['/api/v1/orders', '/api/orders'], orderRoutes);
app.use(['/api/v1/admin/users', '/api/admin/users'], userAdminRoutes);
app.use(['/api/v1/categories', '/api/categories'], categoryRoutes);
app.use(['/api/v1/messages', '/api/messages'], messageRoutes);
app.use(['/api/v1/ads', '/api/ads'], adRoutes);
app.use(['/api/v1/tasks', '/api/tasks'], taskRoutes);
app.use(['/api/v1/payments', '/api/payments'], paymentRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Kudeja Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
    },
  });
});

// Health check
app.get(['/api/v1/health', '/api/health'], (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    uptime: process.uptime(),
  });
});

app.get(['/api/v1/health/ai', '/api/health/ai'], (req, res) => {
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

    // Test reachability of users table
    const userCount = await User.count();
    console.log(`📊 Users table reachable (Total users: ${userCount})`);

    // Auto-seed default admin if not exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kudeja.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await User.create({
        username: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true
      });
      console.log(`👤 Default admin user initialized (${adminEmail})`);
    }
    
    // Gemini AI Startup Check
    const { getAIResponse } = require('./services/aiService');
    const testKey = process.env.GEMINI_API_KEY;
    if (testKey && testKey !== 'your_gemini_api_key_here' && !testKey.startsWith('REPLACE_')) {
      console.log('🤖 Gemini AI: Checking connectivity...');
      getAIResponse('Hello', '')
        .then(() => console.log('✅ Gemini AI: Connection Successful!'))
        .catch(err => {
            console.error('❌ Gemini AI: Connection Failed:', err.message);
        });
    } else {
      console.log('⚠️ Gemini AI: No valid API Key found. System will use Keyword matching.');
    }
  } catch (error) {
    console.error('❌ Database startup error:', error.message);
  }

  // Handle Passenger / local port binding
  if (typeof PORT === 'string' && (PORT.startsWith('/') || PORT.startsWith('\\\\'))) {
    server.listen(PORT, () => {
      console.log(`✅ Backend running on Passenger socket: ${PORT}`);
    });
  } else {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Backend running at: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`);
    });
  }
}

start();

module.exports = app;
