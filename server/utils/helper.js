const fs = require('fs');
const path = require('path');

// Generate random string for file names
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Delete file helper
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Calculate average rating
const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
};

// Sanitize string for search
const sanitizeSearchString = (str) => {
  if (!str) return '';
  return str.toString().toLowerCase().trim().replace(/[^\w\s]/gi, '');
};

// Create search query for skills
const createSkillSearchQuery = (searchTerm) => {
  if (!searchTerm) return {};
  
  const sanitizedTerm = sanitizeSearchString(searchTerm);
  const regex = new RegExp(sanitizedTerm, 'i');
  
  return {
    $or: [
      { 'skillsOffered.name': regex },
      { 'skillsOffered.description': regex },
      { 'skillsOffered.category': regex },
      { 'skillsWanted.name': regex },
      { 'skillsWanted.description': regex },
      { 'skillsWanted.category': regex }
    ]
  };
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  // At least 6 characters, contains letter and number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
};

// Format date for reports
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Check if file is image
const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
};

// Generate pagination metadata
const generatePaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    total,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

// Escape regex special characters
// Escape regex special characters
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};


// Generate unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  const extension = getFileExtension(originalname);
  return `${timestamp}-${random}${extension}`;
};

// Check if user can access profile
const canAccessProfile = (profile, currentUserId) => {
  if (!profile) return false;
  if (profile.banned) return false;
  if (profile.isPublic) return true;
  if (profile._id.toString() === currentUserId) return true;
  return false;
};

// Filter sensitive user data
const filterUserData = (user, currentUserId) => {
  if (!user) return null;
  
  const filteredUser = {
    _id: user._id,
    name: user.name,
    location: user.location,
    profilePhoto: user.profilePhoto,
    averageRating: user.averageRating,
    availability: user.availability,
    skillsOffered: user.skillsOffered.filter(skill => skill.status === 'approved'),
    skillsWanted: user.skillsWanted.filter(skill => skill.status === 'approved'),
    createdAt: user.createdAt
  };
  
  // If it's the user's own profile or they're admin, include more data
  if (currentUserId && user._id.toString() === currentUserId) {
    filteredUser.email = user.email;
    filteredUser.isPublic = user.isPublic;
    filteredUser.isAdmin = user.isAdmin;
    filteredUser.banned = user.banned;
    filteredUser.skillsOffered = user.skillsOffered; // Include all skills
    filteredUser.skillsWanted = user.skillsWanted; // Include all skills
  }
  
  return filteredUser;
};

// Generate notification message
const generateNotificationMessage = (type, data) => {
  switch (type) {
    case 'request_received':
      return `You have a new skill swap request from ${data.requesterName}`;
    case 'request_accepted':
      return `Your skill swap request has been accepted by ${data.recipientName}`;
    case 'request_rejected':
      return `Your skill swap request has been declined by ${data.recipientName}`;
    case 'skill_approved':
      return `Your skill "${data.skillName}" has been approved`;
    case 'skill_rejected':
      return `Your skill "${data.skillName}" has been rejected. Reason: ${data.reason}`;
    case 'rating_received':
      return `You received a ${data.rating}-star rating from ${data.raterName}`;
    case 'user_banned':
      return `Your account has been banned. Reason: ${data.reason}`;
    case 'user_unbanned':
      return `Your account has been unbanned. Welcome back!`;
    default:
      return 'You have a new notification';
  }
};

// Validate skill data
const validateSkillData = (skill) => {
  if (!skill.name || skill.name.trim().length < 2) {
    return { isValid: false, error: 'Skill name must be at least 2 characters long' };
  }
  
  if (!skill.description || skill.description.trim().length < 10) {
    return { isValid: false, error: 'Skill description must be at least 10 characters long' };
  }
  
  if (!skill.category || skill.category.trim().length < 2) {
    return { isValid: false, error: 'Skill category must be at least 2 characters long' };
  }
  
  return { isValid: true };
};

// Check for inappropriate content (basic implementation)
const containsInappropriateContent = (text) => {
  if (!text) return false;
  
  const inappropriateWords = [
    'spam', 'scam', 'fake', 'fraud', 'cheat', 'hack', 'illegal',
    'xxx', 'adult', 'casino', 'gambling', 'drug', 'weapon'
  ];
  
  const lowerText = text.toLowerCase();
  return inappropriateWords.some(word => lowerText.includes(word));
};

module.exports = {
  generateRandomString,
  deleteFile,
  calculateAverageRating,
  sanitizeSearchString,
  createSkillSearchQuery,
  isValidEmail,
  isValidPassword,
  formatDate,
  getFileExtension,
  isImageFile,
  generatePaginationMeta,
  escapeRegex,
  generateUniqueFilename,
  canAccessProfile,
  filterUserData,
  generateNotificationMessage,
  validateSkillData,
  containsInappropriateContent
};