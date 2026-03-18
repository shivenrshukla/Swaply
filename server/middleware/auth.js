import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database, excluding the password
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    // Attach user to the request object
    // Note: Mongoose documents have an 'id' getter which is a string representation of '_id'
    // To maintain consistency with previous logic where `req.user.id` was used, we can ensure it exists.
    req.user = user;
    req.user.id = user._id.toString();

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;