import express from 'express';
const router = express.Router();

import auth from '../middleware/auth.js';
import { createBroadcast, deleteMessage, getAnnouncements, getConversation, getConversationList, getMessageById, getMessages, getUnreadAnnouncementsCount, markAllAnnouncmentsRead, markAsRead, sendUnicast } from '../controllers/messageController.js';

// Get conversation list (sidebar — all users I've messaged or received from)
router.get('/conversations', auth, getConversationList);

// Get full bidirectional conversation with a specific user
router.get('/conversation/:userId', auth, getConversation);

// Get user's messages
router.get('/', auth, getMessages);

// Get announcements specifically
router.get('/announcements', auth, getAnnouncements);

// Get unread announcements count
router.get('/announcements/unread-count', auth, getUnreadAnnouncementsCount);

// Mark announcement as read
router.patch('/:id/read', auth, markAsRead);

// Mark all announcements as read
router.patch('/announcements/read-all', auth, markAllAnnouncmentsRead);

// Send broadcast message (admin only)
router.post('/broadcast', auth, createBroadcast);

// Send individual message
router.post('/', auth, sendUnicast);

// Get message by ID
router.get('/:id', auth, getMessageById);

// Delete message
router.delete('/:id', auth, deleteMessage);

export default router;