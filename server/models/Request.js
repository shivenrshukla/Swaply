const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillOffered: {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // CORRECTED: Changed from true to false
    },
    skillName: {
      type: String,
      required: true
    }
  },
  skillRequested: {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // CORRECTED: Changed from true to false
    },
    skillName: {
      type: String,
      required: true
    }
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  proposedDuration: {
    type: String,
    required: true
  },
  proposedSchedule: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Additional fields for better tracking
  rating: {
    requesterRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    recipientRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  },
  feedback: {
    requesterFeedback: {
      type: String,
      maxlength: 1000,
      default: null
    },
    recipientFeedback: {
      type: String,
      maxlength: 1000,
      default: null
    }
  }
});

// Create indexes for better query performance
requestSchema.index({ requester: 1, status: 1 });
requestSchema.index({ recipient: 1, status: 1 });
requestSchema.index({ createdAt: -1 });
requestSchema.index({ status: 1 });

// Update the updatedAt field before saving
requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for getting the other participant
requestSchema.virtual('otherParticipant').get(function() {
  // This would be used in the context where we know the current user
  return this.requester.toString() === this.currentUserId ? this.recipient : this.requester;
});

// Method to check if request can be accepted
requestSchema.methods.canBeAccepted = function() {
  return this.status === 'pending';
};

// Method to check if request can be cancelled
requestSchema.methods.canBeCancelled = function() {
  return ['pending', 'accepted'].includes(this.status);
};

// Static method to get requests for a user
requestSchema.statics.getRequestsForUser = function(userId, type = 'all') {
  const query = {};
  
  if (type === 'incoming') {
    query.recipient = userId;
  } else if (type === 'outgoing') {
    query.requester = userId;
  } else {
    query.$or = [
      { requester: userId },
      { recipient: userId }
    ];
  }
  
  return this.find(query)
    .populate('requester', 'name email avatar')
    .populate('recipient', 'name email avatar')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Request', requestSchema);