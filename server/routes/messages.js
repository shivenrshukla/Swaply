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
      // Updated to work with recipients array schema
      filter = {
        'recipients.user': req.user.id,
        // You could add a field to distinguish announcements, or use priority/isGlobal
        $or: [
          { isGlobal: true },
          { priority: { $in: ['medium', 'high'] } } // Assuming announcements have medium/high priority
        ]
      };
    } else {
      // Default to inbox - updated for recipients array
      filter = {
        'recipients.user': req.user.id,
        isGlobal: { $ne: true }
      };
    }

    const messages = await Message.find(filter)
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform messages to include read status for current user
    const messagesWithReadStatus = messages.map(message => {
      const userRecipient = message.recipients?.find(
        recipient => recipient.user.toString() === req.user.id
      );
      
      return {
        ...message,
        isRead: !!userRecipient?.readAt,
        readAt: userRecipient?.readAt
      };
    });

    const total = await Message.countDocuments(filter);

    res.json({
      messages: messagesWithReadStatus,
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

// Get announcements specifically
router.get('/announcements', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const filter = {
      'recipients.user': req.user.id
    };

    const announcements = await Message.find(filter)
      .populate('sender', 'name email profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform to include read status
    const announcementsWithReadStatus = announcements.map(announcement => {
      const userRecipient = announcement.recipients.find(
        recipient => recipient.user.toString() === req.user.id
      );
      
      return {
        ...announcement,
        isRead: !!userRecipient?.readAt,
        readAt: userRecipient?.readAt
      };
    });

    const total = await Message.countDocuments(filter);

    res.json({
      announcements: announcementsWithReadStatus,
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

// Mark announcement as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await Message.findOneAndUpdate(
      {
        _id: messageId,
        'recipients.user': userId,
        'recipients.readAt': null
      },
      {
        $set: {
          'recipients.$.readAt': new Date()
        }
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found or already read' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread announcements count
router.get('/announcements/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      'recipients.user': req.user.id,
      'recipients.readAt': null
    });

    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send broadcast message (admin only)
router.post('/broadcast', auth, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { title, content, priority = 'medium' } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Use the static method from your schema
    const sentCount = await Message.sendBroadcast({
      senderId: req.user.id,
      title,
      content,
      priority
    });

    res.status(201).json({
      message: 'Broadcast sent successfully',
      sentToUsers: sentCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send individual message (updated for recipients array)
router.post('/', auth, validateMessage, async (req, res) => {
  try {
    const { recipient, title, content, priority = 'medium' } = req.body;

    // Check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Check if recipient is banned
    if (recipientUser.isBanned) {
      return res.status(400).json({ message: 'Cannot send message to banned user' });
    }

    // Check if sender is banned
    const senderUser = await User.findById(req.user.id);
    if (senderUser.isBanned) {
      return res.status(403).json({ message: 'Cannot send messages while banned' });
    }

    const message = new Message({
      sender: req.user.id,
      recipients: [{ user: recipient }],
      title,
      content,
      priority,
      isGlobal: false
    });

    await message.save();

    await message.populate('sender', 'name email profilePhoto');

    res.status(201).json({
      message: 'Message sent successfully',
       message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all announcements as read
router.patch('/announcements/read-all', auth, async (req, res) => {
  try {
    await Message.updateMany(
      {
        'recipients.user': req.user.id,
        'recipients.readAt': null
      },
      {
        $set: {
          'recipients.$.readAt': new Date()
        }
      }
    );

    res.json({ message: 'All announcements marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete message (updated for recipients array)
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    const isRecipient = message.recipients.some(
      recipient => recipient.user.toString() === req.user.id
    );
    const isSender = message.sender.toString() === req.user.id;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For recipients array schema, you might want to add deletedBy fields
    // or simply remove the message for the current user
    if (isRecipient) {
      // Remove user from recipients array
      message.recipients = message.recipients.filter(
        recipient => recipient.user.toString() !== req.user.id
      );
    }

    if (isSender) {
      message.deletedBySender = true;
    }

    // If no recipients left and sender deleted, remove from database
    if (message.recipients.length === 0 && message.deletedBySender) {
      await Message.findByIdAndDelete(req.params.id);
    } else {
      await message.save();
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get message by ID (updated for recipients array)
router.get('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email profilePhoto')
      .lean();

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    const isRecipient = message.recipients.some(
      recipient => recipient.user.toString() === req.user.id
    );
    const isSender = message.sender._id.toString() === req.user.id;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if user is recipient and not already read
    if (isRecipient) {
      const userRecipient = message.recipients.find(
        recipient => recipient.user.toString() === req.user.id
      );

      if (!userRecipient.readAt) {
        await Message.findOneAndUpdate(
          {
            _id: req.params.id,
            'recipients.user': req.user.id
          },
          {
            $set: {
              'recipients.$.readAt': new Date()
            }
          }
        );
      }

      // Add read status to response
      message.isRead = !!userRecipient.readAt;
      message.readAt = userRecipient.readAt;
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
