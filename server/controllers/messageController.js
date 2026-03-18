import Message from '../models/Message.js';
import User from '../models/User.js';

// Constants
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Get full conversation between current user and another user (both directions)
export const getConversation = async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.userId;

        const messages = await Message.find({
            isGlobal: false,
            $or: [
                // Messages I sent to them
                { sender: myId, 'recipients.user': otherId },
                // Messages they sent to me
                { sender: otherId, 'recipients.user': myId }
            ]
        })
        .populate('sender', 'name email')
        .sort({ createdAt: 1 })  // oldest first — like WhatsApp
        .lean();

        // Mark all unread (received) messages as read
        await Message.updateMany(
            { sender: otherId, 'recipients.user': myId, 'recipients.readAt': null },
            { $set: { 'recipients.$.readAt': new Date() } }
        );

        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Error getting conversation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// Get conversation list (all people the current user has talked with)
export const getConversationList = async (req, res) => {
    try {
        const myId = req.user.id;

        // Get all DMs involving this user
        const allMessages = await Message.find({
            isGlobal: false,
            $or: [
                { sender: myId },
                { 'recipients.user': myId }
            ]
        })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 })
        .lean();

        // Build conversation list — one entry per other party
        const conversationMap = new Map();

        for (const msg of allMessages) {
            const isSender = msg.sender?._id?.toString() === myId || msg.sender?.toString() === myId;
            let otherId, otherName;

            if (isSender) {
                // I sent this — other party is the first recipient
                const recip = msg.recipients?.[0];
                if (!recip) continue;
                otherId = recip.user?.toString();
                otherName = recip.userName || null; // may not be populated
            } else {
                // I received this — other party is the sender
                otherId = msg.sender?._id?.toString() || msg.sender?.toString();
                otherName = msg.sender?.name;
            }

            if (!otherId || conversationMap.has(otherId)) continue;

            const myRecipient = msg.recipients?.find(r =>
                r.user?.toString() === myId || r.user?._id?.toString() === myId
            );
            const isRead = isSender || !!myRecipient?.readAt;

            conversationMap.set(otherId, {
                _id: otherId,
                name: otherName || 'Unknown',
                lastMessage: msg.content,
                lastMessageTime: msg.createdAt,
                unread: !isRead
            });
        }

        // Populate names for sent messages (recipients aren't populated by default)
        const User = (await import('../models/User.js')).default;
        const convList = [];
        for (const [id, conv] of conversationMap) {
            if (!conv.name || conv.name === 'Unknown') {
                const u = await User.findById(id).select('name').lean();
                conv.name = u?.name || 'Unknown';
            }
            convList.push(conv);
        }

        return res.status(200).json({ success: true, conversations: convList });
    } catch (error) {
        console.error('Error getting conversation list:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export const getMessages = async (req, res) => {

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
                'recipients.user': req.user.id,
                $or: [
                    { isGlobal: true },
                    { priority: { $in: ['medium', 'high'] } }
                ]
            };
        } else {
            filter = {
                'recipients.user': req.user.id,
                isGlobal: { $ne: true }
            };
        }

        const messages = await Message.find(filter)
            .populate('sender', 'username email profilePicture')
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

        return res.status(200).json({
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
        console.error("Error getting user's messages");
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const getAnnouncements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
        const limit = Math.min(parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
        const skip = (page - 1) * limit;

        const filter = {
            'recipients.user': req.user.id,
            isGlobal: true
        };

        const announcements = await Message.find(filter)
            .populate('sender', 'username email profilePicture')
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

        return res.status(200).json({
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
        console.error('Error fecthing announcements');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Get unread announcements count
export const getUnreadAnnouncementsCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({
            'recipients.user': req.user.id,
            'recipients.readAt': null,
            isGlobal: true
        });

        return res.status(200).json({ 
            success: true,
            unreadCount: count 
        });

    } catch (error) {
        console.error('Error fetching unread announcements');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Mark announcement as read
export const markAsRead = async (req, res) => {
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
            return res.status(404).json({ 
                success: false,
                message: 'Message not found or already read' 
            });
        }

        return res.status(200).json({ 
            success: true,
            message: 'Message marked as read' 
        });
    } catch (error) {
        console.error('Error marking announcement as read');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Mark all announcements as read
export const markAllAnnouncmentsRead = async (req, res) => {
    try {
        await Message.updateMany(
        {
            'recipients.user': req.user.id,
            'recipients.readAt': null,
            isGlobal: true
        },
        {
            $set: {
                'recipients.$.readAt': new Date()
            }
        }
    );

    res.status(200).json({ 
        success: true,
        message: 'All announcements marked as read' 
    });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

export const createBroadcast = async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.user.id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { title, content, priority = 'medium' } = req.body;

        if (!title || !content) {
            return res.status(400).json({ 
                success: false,
                message: 'Title and content are required' 
            });
        }

        // Use the static method from your schema
        const sentCount = await Message.sendBroadcast({
            senderId: req.user.id,
            title,
            content,
            priority
        });

        return res.status(201).json({
            success: true,
            message: 'Broadcast sent successfully',
            sentToUsers: sentCount
        });
    } catch (error) {
        console.error('Error sending broadcast:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

// Send individual message
export const sendUnicast = async (req, res) => {
    try {
        const { recipient, title, content, priority = 'medium' } = req.body;

        if (!recipient || !content) {
            return res.status(400).json({
                success: false,
                message: 'Recipient and content are required'
            });
        }

        // Check if the recipient exits
        const recipientUser = await User.findById(recipient);
        if (!recipientUser) {
            return res.status(404).json({
                success: false,
                message: 'Recipient not found'
            });
        }

        // Check if the recipient is banned
        if (recipientUser.isBanned) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot send message to banned user' 
            });
        }

        // Check if sender is banned
        const senderUser = await User.findById(req.user.id);
        if (senderUser.isBanned) {
            return res.status(403).json({ 
                success: false,
                message: 'Cannot send messages while banned' 
            });
        }

        const message = new Message({
            sender: req.user.id,
            recipients: [{user: recipient}],
            title: title || 'Direct Message',
            content,
            priority,
            isGlobal: false
        });

        await message.save();
        await message.populate('sender', 'username email profilePicture');
        
        return res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        console.error(`Error sending message:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const getMessageById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate('sender', 'username email profilePicture')
            .lean();

        if (!message) {
            return res.status(404).json({ 
                success: false,
                message: 'Message not found' 
            });
        }

        // Check if user is sender or recipient
        const isRecipient = message.recipients.some(
            recipient => recipient.user.toString() === req.user.id
        );
        const isSender = message.sender._id.toString() === req.user.id;
        const isGlobal = message.isGlobal;

        if (!isSender && !isRecipient && !isGlobal) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied' 
            });
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

        return res.status(200).json({
            success: true,
            message
        });
    } catch (error) {
        console.error(`Error getting messages:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Delete a message
export const deleteMessage = async (req, res) => {
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

    // For recipients, remove user from recipients array
    if (isRecipient) {
      message.recipients = message.recipients.filter(
        recipient => recipient.user.toString() !== req.user.id
      );
    }

    if (isSender) {
      message.deletedBySender = true;
    }

    // If no recipients left and sender deleted, remove from database
    if (message.recipients.length === 0 || (isSender && !isRecipient)) {
      await Message.findByIdAndDelete(req.params.id);
    } else {
      await message.save();
    }

    return res.status(200).json({ 
        success: true,
        message: 'Message deleted successfully' 
    });
    } catch (error) {
        console.error(`Error deleting message:`, error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}