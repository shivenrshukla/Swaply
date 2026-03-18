import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import { getAllUsers, banUser, makeAdmin, deleteUser, getAllSkillRequests, approveOrReject, getRequests, createAndSendBroadcast, statistics, userActivityReport, feedbackReport, swapStatistics } from '../controllers/adminController.js';

// Get all users' info
router.get('/users', auth, adminAuth, getAllUsers);

// Ban/Unban user
router.patch('/users/:id/ban', auth, adminAuth, banUser);

// Set a user's admin status
router.patch('/users/:id/set-admin', auth, adminAuth, makeAdmin);

// Delete a user
router.delete('/users/:id', auth, adminAuth, deleteUser);

// Get all skill requests for moderation
router.get('/skill-requests', auth, adminAuth, getAllSkillRequests);

// Approve/Reject skill
router.patch('/skills/:userId/approve', auth, adminAuth, approveOrReject);

// Get all requests/swaps
router.get('/requests', auth, adminAuth, getRequests);

// Send platform-wide message
router.post('/broadcast', auth, adminAuth, createAndSendBroadcast);

// Get platform statistics
router.get('/stats', auth, adminAuth, statistics);

// Download user activity report
router.get('/reports/user-activity', auth, adminAuth, userActivityReport);

// Download feedback report
router.get('/reports/feedback', auth, adminAuth, feedbackReport);

// Download swap statistics report
router.get('/reports/swaps', auth, adminAuth, swapStatistics);

export default router;