const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');
const { PAGINATION } = require('../config/constants');

// Get user's messages
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;
    const type = req.query.type; // inbox, sent, announcements

    let filter = {};
    
    if (type === 'sent') {
      filter.sender = req.user.id;
    } else if (type === 'announcements') {
      filter = {
        recipient: req.user.id,
        isAdminMessage: true
      };
    } else {
      // Default to inbox
      filter = {
        recipient: req.user.id,
        isAdminMessage: { $ne: true }
      };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name email profilePhoto')
      .populate('recipient', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments(filter);

    // Mark messages as read if viewing inbox
    if (type !== 'sent') {
      await Message.updateMany(
        { recipient: req.user.id, read: false },
        { read: true }
      );
    }

    res.json({
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message
router.post('/', auth, validateMessage, async (req, res) => {
  try {
    const { recipient, title, content, type } = req.body;

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'recipient not found' });
    }

    // Check if recipient is banned
    if (recipientUser.banned) {
      return res.status(400).json({ message: 'Cannot send message to banned user' });
    }

    // Check if sender is banned
    const senderUser = await User.findById(req.user.id);
    if (senderUser.banned) {
      return res.status(403).json({ message: 'Cannot send messages while banned' });
    }

    const message = new Message({
      sender: req.user.id,
      recipient,
      title,
      content,
      type: type || 'message',
      isAdminMessage: false
    });

    await message.save();

    await message.populate('sender', 'name email profilePhoto');
    await message.populate('recipient', 'name email profilePhoto');

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all messages as read
router.patch('/read/all', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { 
        recipient: req.user.id, 
        read: false,
        deletedByrecipient: { $ne: true }
      },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread message count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      read: false,
      deletedByrecipient: { $ne: true }
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.sender.toString() !== req.user.id && 
        message.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete - mark as deleted for the user
    if (message.sender.toString() === req.user.id) {
      message.deletedBySender = true;
    }
    if (message.recipient.toString() === req.user.id) {
      message.deletedByrecipient = true;
    }

    // If both users have deleted, remove from database
    if (message.deletedBySender && message.deletedByrecipient) {
      await Message.findByIdAndDelete(req.params.id);
    } else {
      await message.save();
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get message by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email profilePhoto')
      .populate('recipient', 'name email profilePhoto');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.sender._id.toString() !== req.user.id && 
        message.recipient._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if user is recipient
    if (message.recipient._id.toString() === req.user.id && !message.read) {
      message.read = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;