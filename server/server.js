import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Socket.IO imports
import http from 'http';
import { Server } from 'socket.io';

// --- Express App Setup ---
const app = express();

// Create HTTP server
const server = http.createServer(app);

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

// Create a separate schema for chat room messages (lightweight, real-time only)
const chatRoomMessageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  room: { type: String, default: 'general' },
  timestamp: { type: Date, default: Date.now }
});

const ChatRoomMessage = mongoose.model('ChatRoomMessage', chatRoomMessageSchema);

// --- Socket.IO Real-time Logic ---
let onlineUsers = new Map(); // For direct messaging
let chatUsers = new Map(); // For chat rooms

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // --- Direct Messaging Logic (existing) ---
  socket.on('add_user', (userId) => {
    onlineUsers.set(userId.toString(), socket.id);
    console.log(`👤 User added: ${userId} with socket ${socket.id}`);
    
    // Emit online status to all connected users
    io.emit('user_online', userId.toString());
  });

  socket.on('send_message', async (messageData) => {
    const recipientId = messageData.recipient?.toString();
    const recipientSocketId = onlineUsers.get(recipientId);
    console.log(`✉️ Message from ${messageData.sender} to ${recipientId}`);
    
    // Send to recipient if online
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', messageData);
    } else {
      console.log(`❌ Recipient ${recipientId} is not online.`);
    }
    
    // Also send confirmation back to sender
    socket.emit('message_sent', {
      success: true,
      recipientOnline: !!recipientSocketId,
      messageId: messageData._id
    });
  });

  // --- Chat Room Logic (new) ---
  socket.on('join', async ({ username, userId, room = 'general' }) => {
    if (!username || !userId) {
      console.error('Join failed: missing username or userId');
      socket.emit('error', { message: 'Username and userId are required' });
      return;
    }

    socket.join(room);
    chatUsers.set(socket.id, { username, userId, room });
    console.log(`💬 ${username} joined room: ${room}`);
    
    // Load previous messages
    try {
      const messages = await ChatRoomMessage.find({ room })
        .sort({ timestamp: -1 })
        .limit(50)
        .populate('userId', 'username profilePicture');
      
      socket.emit('previousMessages', messages.reverse());
    } catch (err) {
      console.error('Error loading messages:', err);
    }
    
    // Notify room
    io.to(room).emit('userJoined', {
      username,
      message: `${username} has joined the chat`,
      timestamp: new Date()
    });
    
    // Send active users list
    const roomUsers = Array.from(chatUsers.values())
      .filter(u => u.room === room)
      .map(u => ({ username: u.username, userId: u.userId }));
    io.to(room).emit('activeUsers', roomUsers);
  });

  socket.on('sendMessage', async (data) => {
    const user = chatUsers.get(socket.id);
    if (!user) {
      console.error('sendMessage failed: user not found in chatUsers');
      socket.emit('error', { message: 'User not found. Please rejoin the chat.' });
      return;
    }

    if (!data.message || !data.message.trim()) {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    try {
      const newMessage = new ChatRoomMessage({
        username: user.username,
        userId: user.userId,
        message: data.message.trim(),
        room: user.room
      });

      await newMessage.save();

      io.to(user.room).emit('message', {
        id: newMessage._id,
        username: user.username,
        userId: user.userId,
        message: data.message.trim(),
        timestamp: newMessage.timestamp
      });
    } catch (err) {
      console.error('Error saving message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', () => {
    const user = chatUsers.get(socket.id);
    if (user) {
      socket.to(user.room).emit('userTyping', user.username);
    }
  });

  socket.on('stopTyping', () => {
    const user = chatUsers.get(socket.id);
    if (user) {
      socket.to(user.room).emit('userStoppedTyping', user.username);
    }
  });

  socket.on('leave_room', () => {
    const user = chatUsers.get(socket.id);
    if (user) {
      socket.leave(user.room);
      io.to(user.room).emit('userLeft', {
        username: user.username,
        message: `${user.username} has left the chat`,
        timestamp: new Date()
      });
      
      // Update active users
      chatUsers.delete(socket.id);
      const roomUsers = Array.from(chatUsers.values())
        .filter(u => u.room === user.room)
        .map(u => ({ username: u.username, userId: u.userId }));
      io.to(user.room).emit('activeUsers', roomUsers);
    }
  });

  // --- Disconnect Logic ---
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    // Remove from direct messaging
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('user_offline', userId);
        console.log(`👤 User removed: ${userId}`);
        break;
      }
    }
    
    // Remove from chat rooms
    const user = chatUsers.get(socket.id);
    if (user) {
      io.to(user.room).emit('userLeft', {
        username: user.username,
        message: `${user.username} has left the chat`,
        timestamp: new Date()
      });
      
      chatUsers.delete(socket.id);
      
      // Update active users
      const roomUsers = Array.from(chatUsers.values())
        .filter(u => u.room === user.room)
        .map(u => ({ username: u.username, userId: u.userId }));
      io.to(user.room).emit('activeUsers', roomUsers);
    }
  });
});

// Security middleware
app.use(helmet());

// CORS options for Express routes
const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting (exclude chat endpoints for real-time)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.path.startsWith('/api/chat') || req.path.startsWith('/api/chatroom')
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/skillswap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files for uploads
app.use(express.static(path.join(__dirname, 'uploads')));

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const username = req.body.username || 'anonymous';
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeUsername = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${file.fieldname}-${safeUsername}-${timestamp}-${random}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  return res.json({
    message: 'File uploaded successfully!',
    filePath: `/uploads/${req.file.filename}`
  });
});

// REST API endpoint to get chat room messages
app.get('/api/chatroom/messages/:room', async (req, res) => {
  try {
    const messages = await ChatRoomMessage.find({ room: req.params.room })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate('userId', 'username profilePicture');
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get list of available chat rooms
app.get('/api/chatroom/list', async (req, res) => {
  try {
    const rooms = await ChatRoomMessage.distinct('room');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import matchRoutes from './routes/matchRoutes.js';
import skillRoutes from './routes/skills.js';
import requestRoutes from './routes/requests.js';
import ratingRoutes from './routes/ratings.js';
import adminRoutes from './routes/admin.js';
import messageRoutes from './routes/messages.js';

// Import route handlers

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Export for testing or external use
export { app, server, io };