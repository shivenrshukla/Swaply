import express from 'express';
const router = express.Router();

import auth from '../middleware/auth.js';
import { validateRequest } from '../middleware/validators.js';
import { acceptRequest, cancelRequest, createRequest, deleteRequest, getSpecificRequest, getUsersReceivedRequest, getUsersSentRequest, markAsCompleted, rejectRequest } from '../controllers/requestController.js';

// Create a new request
router.post('/', auth, validateRequest, createRequest);

// Get user's sent requests
router.get('/sent', auth, async (req, res) => getUsersSentRequest);

// Get user's received requests
router.get('/received', auth, getUsersReceivedRequest);

// Get specific request
router.get('/:id', auth, getSpecificRequest);

// Accept request
router.put('/:id/accept', auth, acceptRequest);

// Reject request
router.put('/:id/reject', auth, rejectRequest);

// Cancel request (by requester)
router.put('/:id/cancel', auth, cancelRequest);

// Delete request (by requester, only if not yet approved)
router.delete('/:id', auth, deleteRequest);

// Mark request as completed
router.put('/:id/complete', auth, markAsCompleted);

export default router;