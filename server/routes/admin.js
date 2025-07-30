const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Request = require('../models/Request');
const Rating = require('../models/Rating');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find({})
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    // Return data in the expected format
    res.json({
      users: users,
      totalPages: totalPages,
      currentPage: page,
      total: totalUsers
    });

  } catch (error) {
    console.error('Admin users route error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Ban/Unban user
router.patch('/users/:id/ban', auth, adminAuth, async (req, res) => {
  try {
    const { banned, banReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.banned = banned;
    user.banReason = banned ? banReason : null;
    await user.save();

    res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set a user's admin status
router.patch('/users/:id/set-admin', auth, adminAuth, async (req, res) => {
  try {
    const { isAdmin } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({ message: 'User admin status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --- AND ADD THIS ROUTE ---
// Delete a user
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Here you could also delete related data if needed
    // await Request.deleteMany({ $or: [{ requester: user._id }, { recipient: user._id }] });
    // await Message.deleteMany({ $or: [{ sender: user._id }, { recipient: user._id }] });
    // await Rating.deleteMany({ $or: [{ rater: user._id }, { ratee: user._id }] });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get all skill requests for moderation
router.get('/skill-requests', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({
      $or: [
        { 'skillsOffered.approved': false },
        { 'skillsWanted.approved': false }
      ]
    })
      .select('name email skillsOffered skillsWanted')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });

    const total = await User.countDocuments({
      $or: [
        { 'skillsOffered.approved': false },
        { 'skillsWanted.approved': false }
      ]
    });

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve/Reject skill
router.patch('/skills/:userId/approve', auth, adminAuth, async (req, res) => {
  try {
    const { skillId, skillType, approved, rejectionReason } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skillArray = skillType === 'offered' ? user.skillsOffered : user.skillsWanted;
    const skill = skillArray.id(skillId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    if (approved) {
      skill.approved = true;
      skill.rejectionReason = null;
    } else {
      skill.approved = false;
      skill.rejectionReason = rejectionReason || 'No reason provided';
    }

    await user.save();

    res.json({ message: `Skill ${approved ? 'approved' : 'rejected'} successfully` });
  } catch (error) {
    console.error('Skill approval error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all requests/swaps
router.get('/requests', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const requests = await Request.find(filter)
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Request.countDocuments(filter);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send platform-wide message
router.post('/broadcast', auth, adminAuth, async (req, res) => {
  try {
    const { title, content, type } = req.body;

    const users = await User.find({ banned: false }).select('_id');
    
    const messages = users.map(user => ({
      sender: req.user.id,
      recipient: user._id,
      title,
      content,
      type: type || 'announcement',
      isAdminMessage: true
    }));

    await Message.insertMany(messages);

    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get platform statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ banned: false });
    const bannedUsers = await User.countDocuments({ banned: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });

    const totalRequests = await Request.countDocuments();
    const pendingRequests = await Request.countDocuments({ status: 'pending' });
    const acceptedRequests = await Request.countDocuments({ status: 'accepted' });
    const completedRequests = await Request.countDocuments({ status: 'completed' });
    const cancelledRequests = await Request.countDocuments({ status: 'cancelled' });

    const totalRatings = await Rating.countDocuments();
    const averageRating = await Rating.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const pendingSkills = await User.countDocuments({
      $or: [
        { 'skillsOffered.status': 'pending' },
        { 'skillsWanted.status': 'pending' }
      ]
    });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        banned: bannedUsers,
        admins: adminUsers
      },
      requests: {
        total: totalRequests,
        pending: pendingRequests,
        accepted: acceptedRequests,
        completed: completedRequests,
        cancelled: cancelledRequests
      },
      ratings: {
        total: totalRatings,
        average: averageRating[0]?.avgRating || 0
      },
      pendingSkills
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download user activity report
router.get('/reports/user-activity', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const users = await User.find(filter)
      .select('name email location skillsOffered skillsWanted averageRating isPublic banned createdAt')
      .sort({ createdAt: -1 });

    const report = users.map(user => ({
      name: user.name,
      email: user.email,
      location: user.location,
      skillsOfferedCount: user.skillsOffered.length,
      skillsWantedCount: user.skillsWanted.length,
      averageRating: user.averageRating,
      isPublic: user.isPublic,
      banned: user.banned,
      joinedDate: user.createdAt
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download feedback report
router.get('/reports/feedback', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const ratings = await Rating.find(filter)
      .populate('rater', 'name email')
      .populate('ratee', 'name email')
      .populate('request', 'skillOffered skillWanted')
      .sort({ createdAt: -1 });

    const report = ratings.map(rating => ({
      raterName: rating.rater.name,
      raterEmail: rating.rater.email,
      rateeName: rating.ratee.name,
      rateeEmail: rating.ratee.email,
      rating: rating.rating,
      feedback: rating.feedback,
      skillOffered: rating.request.skillOffered,
      skillWanted: rating.request.skillWanted,
      date: rating.createdAt
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download swap statistics report
router.get('/reports/swaps', auth, adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const requests = await Request.find(filter)
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 });

    const report = requests.map(request => ({
      requesterName: request.requester.name,
      requesterEmail: request.requester.email,
      recipientName: request.recipient.name,
      recipientEmail: request.recipient.email,
      skillOffered: request.skillOffered,
      skillWanted: request.skillWanted,
      status: request.status,
      requestDate: request.createdAt,
      responseDate: request.updatedAt
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;