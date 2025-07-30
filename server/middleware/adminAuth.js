const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Use either id or _id depending on what's available
    const userId = req.user?.id || req.user?._id;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Access denied. User is banned.' });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = adminAuth;