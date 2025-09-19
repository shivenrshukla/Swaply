const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation'); // Assuming this exists
const { PAGINATION } = require('../config/constants'); // Assuming this exists

// =================================================================
// == REAL-TIME CHAT & CONVERSATION ROUTES
// =================================================================

// GET /api/chat/my - Get all chat conversations for the logged-in user
router.get('/my', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { 'recipients.user': req.user.id }],
      isGlobal: { $ne: true }
    })
    .populate('sender', 'name email profilePhoto')
    .populate('recipients.user', 'name email profilePhoto')
    .sort({ createdAt: -1 })
    .lean();

    const conversationsMap = new Map();

    messages.forEach(message => {
      let partnerId, partner;
      
      if (message.sender._id.toString() === req.user.id) {
        if (message.recipients && message.recipients.length > 0) {
          partnerId = message.recipients[0].user._id.toString();
          partner = message.recipients[0].user;
        }
      } else {
        partnerId = message.sender._id.toString();
        partner = message.sender;
      }

      if (partnerId && partner && !conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          _id: partnerId,
          participants: [
            { _id: req.user.id, name: req.user.name },
            { 
              _id: partner._id, 
              name: partner.name, 
              email: partner.email,
              avatar: partner.profilePhoto 
            }
          ],
          lastMessage: {
            text: message.content,
            timestamp: message.createdAt,
            sender: message.sender._id
          },
          updatedAt: message.createdAt
        });
      }
    });

    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
});

// GET /api/chat/with/:userId - Get message history with a specific user
router.get('/with/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, 'recipients.user': otherUserId },
        { sender: otherUserId, 'recipients.user': req.user.id }
      ],
      isGlobal: { $ne: true }
    })
    .populate('sender', 'name')
    .sort({ createdAt: 1 })
    .lean();
    
    const chatMessages = messages.map(msg => ({
        _id: msg._id,
        content: msg.content,
        text: msg.content,
        sender: msg.sender,
        recipient: otherUserId,
        timestamp: msg.createdAt,
    }));

    res.json(chatMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});


// =================================================================
// == GENERAL MESSAGE & INBOX ROUTES
// =================================================================

// GET /api/chat/ - Get user's messages (inbox, sent, etc.) with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;
    const type = req.query.type; // inbox, sent

    let filter = {};
    if (type === 'sent') {
      filter.sender = req.user.id;
    } else { // Default to inbox
      filter = { 'recipients.user': req.user.id };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const messagesWithReadStatus = messages.map(message => {
      const userRecipient = message.recipients?.find(
        r => r.user.toString() === req.user.id
      );
      return { ...message, isRead: !!userRecipient?.readAt };
    });

    const total = await Message.countDocuments(filter);

    res.json({
      messages: messagesWithReadStatus,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================================
// == MESSAGE ACTIONS
// =================================================================

// POST /api/chat/send - Unified endpoint to send a message
router.post('/send', auth, validateMessage, async (req, res) => {
  try {
    const { recipient, content, title, priority } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }
    
    const [recipientUser, senderUser] = await Promise.all([
      User.findById(recipient),
      User.findById(req.user.id)
    ]);

    if (!recipientUser) return res.status(404).json({ message: 'Recipient not found' });
    if (recipientUser.isBanned) return res.status(400).json({ message: 'Cannot send message to banned user' });
    if (senderUser.isBanned) return res.status(403).json({ message: 'Cannot send messages while banned' });

    const message = new Message({
      sender: req.user.id,
      recipients: [{ user: recipient }],
      title: title || 'Chat Message', // Default title for real-time chat
      content: content,
      priority: priority || 'medium'
    });

    await message.save();
    await message.populate('sender', 'name profilePhoto');

    const chatMessage = {
      _id: message._id,
      content: message.content,
      text: message.content,
      sender: message.sender,
      recipient: recipient,
      timestamp: message.createdAt,
    };

    res.status(201).json(chatMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// =================================================================
// == ANNOUNCEMENT & ADMIN ROUTES
// =================================================================

// GET /api/chat/announcements/unread-count - Get unread announcements count
router.get('/announcements/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      'recipients.user': req.user.id,
      'recipients.readAt': null,
      isGlobal: true // Assuming announcements are marked as global
    });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/chat/announcements/read-all - Mark all announcements as read
router.patch('/announcements/read-all', auth, async (req, res) => {
    try {
        await Message.updateMany(
            { 'recipients.user': req.user.id, 'recipients.readAt': null, isGlobal: true },
            { $set: { 'recipients.$[].readAt': new Date() } }
        );
        res.json({ message: 'All announcements marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// POST /api/chat/broadcast - Send broadcast message (admin only)
router.post('/broadcast', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, content, priority } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const sentCount = await Message.sendBroadcast({
      senderId: req.user.id,
      title,
      content,
      priority
    });

    res.status(201).json({ message: 'Broadcast sent successfully', sentToUsers: sentCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =================================================================
// == SINGLE MESSAGE MANAGEMENT (Must be last to avoid route conflicts)
// =================================================================

// GET /api/chat/:id - Get message by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email profilePhoto')
      .lean();

    if (!message) return res.status(404).json({ message: 'Message not found' });

    const isRecipient = message.recipients.some(r => r.user.toString() === req.user.id);
    const isSender = message.sender._id.toString() === req.user.id;

    if (!isSender && !isRecipient) return res.status(403).json({ message: 'Access denied' });
    
    // Mark as read if user is a recipient and it's unread
    if (isRecipient) {
        const userRecipient = message.recipients.find(r => r.user.toString() === req.user.id);
        if (!userRecipient.readAt) {
            await Message.updateOne(
                { _id: req.params.id, 'recipients.user': req.user.id },
                { $set: { 'recipients.$.readAt': new Date() } }
            );
        }
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// PATCH /api/chat/:id/read - Mark a single message as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, 'recipients.user': req.user.id, 'recipients.readAt': null },
      { $set: { 'recipients.$.readAt': new Date() } },
      { new: true }
    );

    if (!message) return res.status(404).json({ message: 'Message not found or already read' });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// DELETE /api/chat/:id - Delete a message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    // Logic to handle deletion (soft delete or removal)
    // This example removes the recipient or deletes if sender is deleting and no recipients left
    message.recipients = message.recipients.filter(r => r.user.toString() !== req.user.id);
    await message.save();

    res.json({ message: 'Message deleted for user' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
