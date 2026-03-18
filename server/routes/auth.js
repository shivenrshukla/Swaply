import express from 'express';
const router = express.Router();

import auth from '../middleware/auth.js';
import { changePassword, login, profile, register } from '../controllers/authController.js';
import { validateChangePassword, validateUserLogin, validateUserRegistration } from '../middleware/validators.js';

// Register
router.post('/register', validateUserRegistration, register);

// Login
router.post('/login', validateUserLogin, login);

// Get current user
router.get('/me', auth, profile);

// Change password
router.put('/change-password', auth, validateChangePassword, changePassword);

export default router;