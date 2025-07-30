const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  topic: {
    type: String,
    required: true,
    maxlength: 200
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillOffered: {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    skillName: {
      type: String,
      required: true
    }
  },
  skillRequested: {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    skillName: {
      type: String,
      required: true
    }
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    maxlength: 1000,
    default: null
  }
});

const matchSchema = new mongoose.Schema({
  originalRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true
  },
  participants: [participantSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'paused'],
    default: 'active'
  },
  duration: {
    type: String,
    required: true
  },
  schedule: {
    type: String,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  sessions: [sessionSchema],
  lastActivity: {
    type: Date,
    default: Date.now
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
  }
});

// Create indexes for better query performance
matchSchema.index({ 'participants.user': 1, status: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: -1 });
matchSchema.index({ lastActivity: -1 });

// Update the updatedAt field before saving
matchSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastActivity = Date.now();
  next();
});

// Method to calculate progress based on completed sessions
matchSchema.methods.calculateProgress = function() {
  if (this.sessions.length === 0) return 0;
  
  const completedSessions = this.sessions.filter(session => session.completed).length;
  return Math.round((completedSessions / this.sessions.length) * 100);
};

// Method to add a session
matchSchema.methods.addSession = function(sessionData) {
  this.sessions.push(sessionData);
  this.progress = this.calculateProgress();
  return this.save();
};

// Method to mark session as completed
matchSchema.methods.completeSession = function(sessionId) {
  const session = this.sessions.id(sessionId);
  if (session) {
    session.completed = true;
    this.progress = this.calculateProgress();
    return this.save();
  }
  throw new Error('Session not found');
};

// Method to get the other participant
matchSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => p.user.toString() !== userId.toString());
};

// Method to get current user's participant data
matchSchema.methods.getCurrentUserParticipant = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString());
};

// Method to check if match can be cancelled
matchSchema.methods.canBeCancelled = function() {
  return ['active', 'paused'].includes(this.status);
};

// Method to mark match as completed
matchSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = Date.now();
  this.progress = 100;
  return this.save();
};

// Static method to get matches for a user
matchSchema.statics.getMatchesForUser = function(userId, status = 'all') {
  const query = {
    'participants.user': userId
  };
  
  if (status !== 'all') {
    query.status = status;
  }
  
  return this.find(query)
    .populate('participants.user', 'name email avatar')
    .populate('originalRequest')
    .sort({ lastActivity: -1 });
};

// Static method to get active matches count for a user
matchSchema.statics.getActiveMatchesCount = function(userId) {
  return this.countDocuments({
    'participants.user': userId,
    status: 'active'
  });
};

module.exports = mongoose.model('Match', matchSchema);