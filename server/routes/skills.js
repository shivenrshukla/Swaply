const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Search users by skills
router.get('/search', auth, async (req, res) => {
  try {
    const { skill, location, availability, level, page = 1, limit = 10 } = req.query;

    // Build search query
    let query = {
      isPublic: true,
      isBanned: false,
      _id: { $ne: req.user._id } // Exclude current user
    };

    // Add skill filter
    if (skill) {
      query['skillsOffered'] = {
        $elemMatch: {
          name: { $regex: skill, $options: 'i' },
          approved: true
        }
      };
    }

    // Add location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Add availability filter
    if (availability) {
      query.availability = availability;
    }

    // Add level filter
    if (level) {
      query['skillsOffered.level'] = level;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Execute search
    const users = await User.find(query)
      .select('-password -email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ averageRating: -1, createdAt: -1 });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all unique skills
router.get('/list', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      isPublic: true, 
      isBanned: false,
      'skillsOffered.approved': true 
    }).select('skillsOffered');

    const skillsSet = new Set();
    users.forEach(user => {
      user.skillsOffered.forEach(skill => {
        if (skill.approved) {
          skillsSet.add(skill.name);
        }
      });
    });

    const skills = Array.from(skillsSet).sort();
    res.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending skills
router.get('/trending', auth, async (req, res) => {
  try {
    const pipeline = [
      { $match: { isPublic: true, isBanned: false } },
      { $unwind: '$skillsOffered' },
      { $match: { 'skillsOffered.approved': true } },
      { $group: { 
        _id: '$skillsOffered.name', 
        count: { $sum: 1 },
        avgRating: { $avg: '$averageRating' }
      }},
      { $sort: { count: -1, avgRating: -1 } },
      { $limit: 10 }
    ];

    const trendingSkills = await User.aggregate(pipeline);
    res.json({ trendingSkills });
  } catch (error) {
    console.error('Get trending skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get skill recommendations for user
router.get('/recommendations', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const wantedSkills = currentUser.skillsWanted.map(skill => skill.name);

    if (wantedSkills.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Find users who offer skills that current user wants
    const recommendations = await User.find({
      isPublic: true,
      isBanned: false,
      _id: { $ne: req.user._id },
      'skillsOffered': {
        $elemMatch: {
          name: { $in: wantedSkills },
          approved: true
        }
      }
    })
    .select('-password -email')
    .sort({ averageRating: -1 })
    .limit(10);

    res.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;