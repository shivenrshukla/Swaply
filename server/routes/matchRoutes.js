import express from 'express';
const router = express.Router();

import auth from '../middleware/auth.js';
import { createMatch, getUserMatches, activeCount, getMatchById, markMatchAsCompleted, cancelMatch, addSessionToMatch, markSessionAsCompleted, addRatingAndFeedBack, getOtherParticipant } from '../controllers/matchController.js';

router.post('/create', auth, createMatch);

// Get all matches for authenticated user
router.get('/', auth, getUserMatches);

// Get count of active matches for user
router.get('/active/count', auth, activeCount);

// Get specific match by ID
router.get('/:id', auth, getMatchById);

// Mark match as completed
router.put('/:id/complete', auth, markMatchAsCompleted);

// Cancel a match
router.put('/:id/cancel', auth, cancelMatch);

// Add a new session to a match
router.post('/:id/sessions', auth, addSessionToMatch);

// Mark session as completed
router.put('/:id/sessions/:sessionId/complete', markSessionAsCompleted);

// Add rating and feedback for a match
router.put('/:id/rating', auth, addRatingAndFeedBack);

// Get other participant details
router.get('/:id/other-participant', auth, getOtherParticipant);

export default router;