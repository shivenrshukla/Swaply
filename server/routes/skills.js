import express from 'express';
const router = express.Router();

import auth from '../middleware/auth.js';
import { getSkillRecommendations, getTrendingSkills, listAllUniqueSkills, searchBySkill } from '../controllers/skillController.js';

// Search users by skills
router.get('/search', auth, searchBySkill);

// Get all unique skills
router.get('/list', auth, listAllUniqueSkills);

// Get trending skills
router.get('/trending', auth, getTrendingSkills);

// Get skill recommendations for user
router.get('/recommendations', auth, getSkillRecommendations);

export default router;