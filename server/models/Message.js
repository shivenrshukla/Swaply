const mongoose = require('mongoose');

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
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: null
    }
  }],
  isGlobal: {
    type: Boolean,
    default: false
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
  // We need the User model to find all users.
  // Using mongoose.model() here prevents circular dependency issues.
  const User = mongoose.model('User');

  // 1. Find all users who should receive the broadcast.
  const targetUsers = await User.find({
    _id: { $ne: senderId }, // Don't send to the admin themselves
    isBanned: false
  }).select('_id');

  if (targetUsers.length === 0) {
    return 0;
  }

  // 2. Prepare an array of message documents, one for each user.
  const messagesToInsert = targetUsers.map(user => ({
    sender: senderId,
    recipients: [{ user: user._id }],
    title: title,
    content: content,
    isGlobal: false,
  }));

  // 3. Use `this.insertMany()` to save all messages. 'this' refers to the Message model.
  await this.insertMany(messagesToInsert);

  // 4. Return the count of messages sent.
  return messagesToInsert.length;
};

module.exports = mongoose.model('Message', messageSchema);