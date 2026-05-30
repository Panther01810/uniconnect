const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    io.emit('user_online', userId);
    console.log(`User ${userId} joined room`);
  });

  // Handle private messages
  socket.on('private_message', async (data) => {
    try {
      const { senderId, receiverId, message, messageType = 'text' } = data;

      // Save message to database
      const Message = require('./models/Message');
      const newMessage = new Message({
        sender: senderId,
        receiver: receiverId,
        content: message,
        messageType,
        timestamp: new Date()
      });
      await newMessage.save();

      // Send to receiver if online
      if (onlineUsers.has(receiverId)) {
        io.to(receiverId).emit('private_message', {
          ...newMessage.toObject(),
          isOwn: false
        });
      }

      // Confirm to sender
      socket.emit('message_sent', newMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    if (onlineUsers.has(receiverId)) {
      io.to(receiverId).emit('typing_indicator', {
        senderId: data.senderId,
        isTyping
      });
    }
  });

  // Handle group messages
  socket.on('group_message', async (data) => {
    try {
      const { senderId, groupId, message, messageType = 'text' } = data;

      const GroupMessage = require('./models/GroupMessage');
      const newMessage = new GroupMessage({
        sender: senderId,
        group: groupId,
        content: message,
        messageType,
        timestamp: new Date()
      });
      await newMessage.save();

      // Send to all group members
      io.to(`group_${groupId}`).emit('group_message', {
        ...newMessage.toObject(),
        isOwn: false
      });

    } catch (error) {
      console.error('Error sending group message:', error);
      socket.emit('message_error', { error: 'Failed to send group message' });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    // Find and remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user_offline', userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kyuconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };