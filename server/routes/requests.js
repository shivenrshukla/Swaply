const express = require('express');
const { body, validationResult } = require('express-validator');
const Request = require('../models/Request');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new request
router.post('/', [
  auth,
  body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
  body('skillToOffer').trim().isLength({ min: 1, max: 100 }).withMessage('Skill to offer is required'),
  body('skillToRequest').trim().isLength({ min: 1, max: 100 }).withMessage('Skill to request is required'),
  body('message').trim().isLength({ min: 10, max: 500 }).withMessage('Message must be between 10 and 500 characters'),
  body('proposedDuration').trim().isLength({ min: 1, max: 100 }).withMessage('Proposed duration is required'),
  body('proposedSchedule').trim().isLength({ min: 1, max: 200 }).withMessage('Proposed schedule is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, skillToOffer, skillToRequest, message, proposedDuration, proposedSchedule } = req.body;

    // Check if recipient exists and is not banned
    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.isBanned) {
      return res.status(404).json({ message: 'Recipient not found or banned' });
    }

    // Check if user is trying to request from themselves
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Get requester
    const requester = await User.findById(req.user._id);

    // Create new request with skill names
    const newRequest = new Request({
      requester: requester._id,
      recipient: recipientId,
      skillOffered: {
        skillId: null, // We'll use skill names instead
        skillName: skillToOffer
      },
      skillRequested: {
        skillId: null, // We'll use skill names instead
        skillName: skillToRequest
      },
      message,
      proposedDuration,
      proposedSchedule
    });

    await newRequest.save();

    // Populate the request with user details
    await newRequest.populate([
      { path: 'requester', select: 'name profilePhoto' },
      { path: 'recipient', select: 'name profilePhoto' }
    ]);

    res.status(201).json({ message: 'Request sent successfully', request: newRequest });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's sent requests
router.get('/sent', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { requester: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const totalRequests = await Request.countDocuments(query);
    const totalPages = Math.ceil(totalRequests / limit);

    const requests = await Request.find(query)
      .populate('recipient', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRequests,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's received requests
router.get('/received', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { recipient: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const totalRequests = await Request.countDocuments(query);
    const totalPages = Math.ceil(totalRequests / limit);

    const requests = await Request.find(query)
      .populate('requester', 'name profilePhoto averageRating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRequests,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific request
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requester', 'name profilePhoto averageRating')
      .populate('recipient', 'name profilePhoto averageRating');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is involved in this request
    if (request.requester._id.toString() !== req.user._id.toString() && 
        request.recipient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this request' });
    }

    res.json(request);
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept request
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the recipient
    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    request.status = 'accepted';
    await request.save();

    await request.populate([
      { path: 'requester', select: 'name profilePhoto' },
      { path: 'recipient', select: 'name profilePhoto' }
    ]);

    res.json({ message: 'Request accepted successfully', request });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject request
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the recipient
    if (request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer pending' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel request (by requester)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is the requester
    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }

    // Check if request can be cancelled
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete request (by requester, only if not yet approved)
router.delete('/:id', auth, async (req, res) => {
  try {
    const request = await Request.findOneAndDelete({
      _id: req.params.id,
      requester: req.user._id,
      approved: false
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found or already approved' });
    }

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark request as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is involved in this request
    if (request.requester.toString() !== req.user._id.toString() && 
        request.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this request' });
    }

    // Check if request is accepted
    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted requests can be completed' });
    }

    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    res.json({ message: 'Request marked as completed', request });
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;