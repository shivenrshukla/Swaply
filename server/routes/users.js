const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all users (for home page)
router.get('/', auth, async (req, res) => {
  try {
    // Only return public profiles and basic info
    const users = await User.find({ 
      isPublic: true, 
      isBanned: false 
    })
    .select('-password -email') // Exclude sensitive fields
    .sort({ createdAt: -1 }); // Sort by newest first

    res.json({ 
      users: users,
      count: users.length 
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({message:"Server Error"})}
});

// Get user profile
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if profile is public or if user is viewing their own profile
    if (!user.isPublic && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Profile is private' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', [
  auth,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('location').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
  body('availability').optional().isIn(['Available', 'Busy', 'Unavailable']).withMessage('Invalid availability status'),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, location, availability, isPublic } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (location) user.location = location;
    if (availability) user.availability = availability;
    if (typeof isPublic === 'boolean') user.isPublic = isPublic;

    await user.save();

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile photo
router.post('/profile-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to base64 for storage (in production, use cloud storage)
    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const user = await User.findById(req.user._id);
    user.profilePhoto = imageUrl;
    await user.save();

    res.json({ message: 'Profile photo uploaded successfully', profilePhoto: imageUrl });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add skill offered
router.post('/skills/offered', [
  auth,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Skill name must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid skill level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, level } = req.body;
    const user = await User.findById(req.user._id);

    // Check if skill already exists
    const existingSkill = user.skillsOffered.find(skill => skill.name.toLowerCase() === name.toLowerCase());
    if (existingSkill) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsOffered.push({
      name,
      description,
      level,
      approved: false
    });

    await user.save();

    res.status(201).json({ message: 'Skill added successfully (pending approval)' });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add skill wanted
router.post('/skills/wanted', [
  auth,
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Skill name must be between 2 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Description must be between 10 and 500 characters'),
  body('level').isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert']).withMessage('Invalid skill level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, level } = req.body;
    const user = await User.findById(req.user._id);

    // Check if skill already exists
    const existingSkill = user.skillsWanted.find(skill => skill.name.toLowerCase() === name.toLowerCase());
    if (existingSkill) {
      return res.status(400).json({ message: 'Skill already exists' });
    }

    user.skillsWanted.push({
      name,
      description,
      level
    });

    await user.save();

    res.status(201).json({ message: 'Skill added successfully' });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove skill offered
router.delete('/skills/offered/:skillId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.skillsOffered = user.skillsOffered.filter(skill => skill._id.toString() !== req.params.skillId);
    await user.save();

    res.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove skill wanted
router.delete('/skills/wanted/:skillId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.skillsWanted = user.skillsWanted.filter(skill => skill._id.toString() !== req.params.skillId);
    await user.save();

    res.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;