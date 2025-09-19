const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const server = http.createServer(app); // Create an HTTP server from the Express app

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow requests from your frontend
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());

// CORS options for Express routes
const corsOptions = {
  origin: ['http://localhost:5173'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  res.json({
    message: 'File uploaded successfully!',
    filePath: `/uploads/${req.file.filename}`
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/skillswap', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use("/api/video", require("./routes/video"));

// --- Socket.IO Real-time Logic ---
let onlineUsers = new Map(); // Using a Map to store userId -> socketId

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('add_user', (userId) => {
    onlineUsers.set(userId.toString(), socket.id);
    console.log(`👤 User added: ${userId} with socket ${socket.id}`);
  });

  socket.on('send_message', (message) => {
    const recipientId = message.recipient?.toString();
    const recipientSocketId = onlineUsers.get(recipientId);
    console.log(`✉️ Message from ${message.sender} to ${recipientId}`);
    if (recipientSocketId) {
      console.log(`✅ Found recipient socket: ${recipientSocketId}. Relaying message...`);
      io.to(recipientSocketId).emit('receive_message', message);
    } else {
      console.log(`❌ Recipient ${recipientId} is not online.`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👤 User removed: ${userId}`);
        break;
      }
    }
  });
});

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
// Use the http server to listen, which will handle both Express and Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});