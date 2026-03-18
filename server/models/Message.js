import mongoose from 'mongoose';

// ---------------------------------------------------------
// 1. Broadcast Interaction Schema
// Tracks "Read" status for global messages separately
// to avoid the 16MB document limit on the main Message.
// ---------------------------------------------------------
const interactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true,
    index: true
  },
  readAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

interactionSchema.index({ user: 1, message: 1 }, { unique: true });

const BroadcastInteraction = mongoose.model('BroadcastInteraction', interactionSchema);

// 2. Main Message Schema
const messageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{      // Only for Unicast(DMs)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: null
    }
  }],
  isGlobal: {     // Flag for broadcasted
    type: Boolean,
    default: false, 
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Sends a broadcast message to all non-banned, non-admin users.
 * This is a static method, called on the Message model directly.
 * @param {object} broadcastData - The data for the broadcast.
 * @param {string} broadcastData.senderId - The ID of the admin sending the message.
 * @param {string} broadcastData.title - The title of the message.
 * @param {string} broadcastData.content - The content of the message.
 * @returns {Promise<number>} The number of users the message was sent to.
 */

messageSchema.statics.sendBroadcast = async function({ senderId, title, content }) {
  const User = mongoose.model('User');

  // Create ONE global message
  const broadcastMessage = await this.create({
    sender: senderId,
    recipients: [], // Empty array - will be populated lazily
    title: title,
    content: content,
    isGlobal: true, // Mark as global broadcast
  });

  // Get count of target users
  return await User.countDocuments({
    _id: { $ne: senderId },
    isBanned: false
  });
};

/**
 * NEW: Fetches messages for a specific user, merging DMs and Broadcasts.
 * It also populates the 'read' status correctly for both types.
 */
messageSchema.statics.getMessagesForUser = async function(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;

  const messages = await this.find({
    $or: [
      {'recipients.user': userId },
      { isGlobal: true }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('sender', 'name profilePhoto')
  .lean()   // performance purpose  

  // 2. Fetch interactions for the global messages found above
  const globalMessageIds = messages
    .filter(m => m.isGlobal)
    .map(m => m._id);

  const interactions = await BroadcastInteraction.find({
    user: userId,
    message: { $in: globalMessageIds }
  });

  // 3. Merge "Read" status into a unified format for thr frontend
  return messages.map(msg => {
    let readAt = null;

    if (msg.isGlobal) {
      const interaction = interactions.find(i => i.message.toString() === msg._id.toString());

      if (interaction){
        readAt = interaction.readAt;
      }
    } else {
      // Look up for recipient for DMs
      const recipientData = msg.recipients.find(r => r.user.toString() === userId.toString());
      readAt = recipientData ? recipientData.readAt : null;
    }

    return {
      _id: msg._id,
      title: msg.title,
      content: msg.content,
      sender: msg.sender,
      createdAt: msg.createdAt,
      priority: msg.priority,
      isGlobal: msg.isGlobal,
      readAt: readAt,
      isRead: !!readAt
    };
  }).filter(Boolean);  // Removes null
};

// Marks a message as read, handling the logic difference between types.
messageSchema.statics.markAsRead = async function(userId, messageId) {
  const message = await this.findById(messageId);
  if (!message) throw new Error('Message not found!');

  if (message.isGlobal) {
    await BroadcastInteraction.findOneAndUpdate(
      { user: userId, message: messageId },
      { $set: { readAt: new Date() } },
      { upsert: true, new: true }
    );
  } else {
    await this.updateOne(
      { _id: messageId, 'recipients.user': userId },
      { $set: {'recipients.$.readAt': new Date() } }
    );
  }

  return true;
};

const Message = mongoose.model('Message', messageSchema);

export default Message;