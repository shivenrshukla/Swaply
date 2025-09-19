// routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const Request = require('../models/Request'); 
const Match = require('../models/Match'); // Adjust path as needed
const auth = require('../middleware/auth'); // Adjust path as needed

router.post('/create', auth, async (req, res) => {
  const { requestId, duration, schedule, startDate } = req.body;

  if (!requestId || !duration || !schedule || !startDate) {
    return res.status(400).json({ message: 'Missing required fields for match creation.' });
  }

  try {
    const originalRequest = await Request.findById(requestId)
      .populate('requester', 'name')
      .populate('recipient', 'name');

    if (!originalRequest) {
      return res.status(404).json({ message: 'The original swap request could not be found.' });
    }
    
    const currentUserId = req.user.id;
    const isParticipant = [originalRequest.requester._id.toString(), originalRequest.recipient._id.toString()].includes(currentUserId);
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not authorized to confirm this match.' });
    }
    
    const endDate = new Date(startDate);
    const durationMonths = parseInt(duration.split(' ')[0], 10);
    if (!isNaN(durationMonths)) {
      endDate.setMonth(endDate.getMonth() + durationMonths);
    }

    // Fixed: Handle the skill structure properly
    const newMatch = new Match({
      originalRequest: requestId,
      status: 'active',
      duration,
      schedule,
      startDate,
      endDate,
      participants: [
        {
          user: originalRequest.requester._id,
          skillOffered: {
            skillId: originalRequest.skillOffered.skillId || null,
            skillName: originalRequest.skillOffered.skillName,
          },
          skillRequested: {
            skillId: originalRequest.skillRequested.skillId || null,
            skillName: originalRequest.skillRequested.skillName,
          },
        },
        {
          user: originalRequest.recipient._id,
          // The skills are swapped for the second participant
          skillOffered: {
            skillId: originalRequest.skillRequested.skillId || null,
            skillName: originalRequest.skillRequested.skillName,
          },
          skillRequested: {
            skillId: originalRequest.skillOffered.skillId || null,
            skillName: originalRequest.skillOffered.skillName,
          },
        },
      ],
    });

    await newMatch.save();
    await Request.findByIdAndDelete(requestId);
    
    res.status(201).json({
        success: true,
        message: 'Match created successfully!',
        match: newMatch
    });

  } catch (error) {
    // This detailed log will now show you the specific validation error if one occurs
    console.error('Match creation error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error during match creation.', error: error.message });
  }
});

// GET /api/matches - Get all matches for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 Authenticated user ID:', req.user._id);
    console.log('🔍 User ID type:', typeof req.user._id);

    const { status = 'all' } = req.query;
    const matches = await Match.getMatchesForUser(req.user._id, status);
    
    res.json({
      success: true,
      matches,  
      count: matches.length
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
});

// GET /api/matches/active/count - Get count of active matches for user
router.get('/active/count', auth, async (req, res) => {
  try {
    const count = await Match.getActiveMatchesCount(req.user.id);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching active matches count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active matches count',
      error: error.message
    });
  }
});

// GET /api/matches/:id - Get specific match by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('participants.user', 'name email avatar')
      .populate('originalRequest');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if user is participant in this match
    const isParticipant = match.participants.some(p => 
      p.user._id.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match.'
      });
    }
    
    res.json({
      success: true,
      match
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match',
      error: error.message
    });
  }
});

// PUT /api/matches/:id/complete - Mark match as completed
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if user is participant in this match
    const isParticipant = match.participants.some(p => 
      p.user.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match.'
      });
    }
    
    // Check if match can be completed
    if (match.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active matches can be marked as completed'
      });
    }
    
    await match.markCompleted();
    
    res.json({
      success: true,
      message: 'Match marked as completed successfully',
      match
    });
  } catch (error) {
    console.error('Error marking match as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark match as completed',
      error: error.message
    });
  }
});

// PUT /api/matches/:id/cancel - Cancel a match
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if user is participant in this match
    const isParticipant = match.participants.some(p => 
      p.user.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match.'
      });
    }
    
    // Check if match can be cancelled
    if (!match.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'This match cannot be cancelled'
      });
    }
    
    match.status = 'cancelled';
    await match.save();
    
    res.json({
      success: true,
      message: 'Match cancelled successfully',
      match
    });
  } catch (error) {
    console.error('Error cancelling match:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel match',
      error: error.message
    });
  }
});

// POST /api/matches/:id/sessions - Add a new session to a match
router.post('/:id/sessions', auth, async (req, res) => {
  try {
    const { date, topic, duration, notes } = req.body;
    
    if (!date || !topic) {
      return res.status(400).json({
        success: false,
        message: 'Date and topic are required'
      });
    }
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if user is participant in this match
    const isParticipant = match.participants.some(p => 
      p.user.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match.'
      });
    }
    
    const sessionData = {
      date: new Date(date),
      topic,
      duration: duration || 60,
      notes: notes || '',
      completed: false
    };
    
    await match.addSession(sessionData);
    
    res.json({
      success: true,
      message: 'Session added successfully',
      match
    });
  } catch (error) {
    console.error('Error adding session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add session',
      error: error.message
    });
  }
});

// PUT /api/matches/:id/sessions/:sessionId/complete - Mark session as completed
router.put('/:id/sessions/:sessionId/complete', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if user is participant in this match
    const isParticipant = match.participants.some(p => 
      p.user.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match.'
      });
    }
    
    await match.completeSession(req.params.sessionId);
    
    res.json({
      success: true,
      message: 'Session marked as completed',
      match
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete session',
      error: error.message
    });
  }
});

// PUT /api/matches/:id/rating - Add rating and feedback for a match
router.put('/:id/rating', auth, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if user is participant in this match
    const userParticipant = match.getCurrentUserParticipant(req.user.id);
    
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match.'
      });
    }
    
    // Update rating and feedback
    userParticipant.rating = rating;
    userParticipant.feedback = feedback || '';
    
    await match.save();
    
    res.json({
      success: true,
      message: 'Rating and feedback added successfully',
      match
    });
  } catch (error) {
    console.error('Error adding rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add rating',
      error: error.message
    });
  }
});

// GET /api/matches/:id/other-participant - Get other participant details
router.get('/:id/other-participant', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('participants.user', 'name email avatar');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Check if user is participant in this match
    const isParticipant = match.participants.some(p => 
      p.user._id.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match.'
      });
    }
    
    const otherParticipant = match.getOtherParticipant(req.user.id);
    
    res.json({
      success: true,
      participant: otherParticipant
    });
  } catch (error) {
    console.error('Error fetching other participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch other participant',
      error: error.message
    });
  }
});

module.exports = router;