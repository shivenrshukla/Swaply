// utils/JWTUtils.js
const jwt = require('jsonwebtoken');

const JWTUtils = {
  generateToken: (userId, role) => {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  },

  generateRefreshToken: (userId) => {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
  },

  verifyToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  verifyRefreshToken: (refreshToken) => {
    return jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  }
};

module.exports = JWTUtils;
