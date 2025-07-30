// User roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Request statuses
const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Skill statuses
const SKILL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// User availability
const USER_AVAILABILITY = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  UNAVAILABLE: 'Unavailable'
};

// Message types
const MESSAGE_TYPES = {
  MESSAGE: 'message',
  ANNOUNCEMENT: 'announcement',
  WARNING: 'warning',
  UPDATE: 'update',
  NOTIFICATION: 'notification'
};

// Rating range
const RATING_RANGE = {
  MIN: 1,
  MAX: 5
};

// File upload limits
const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Validation limits
const VALIDATION_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 6,
  LOCATION_MIN: 2,
  LOCATION_MAX: 100,
  SKILL_NAME_MIN: 2,
  SKILL_NAME_MAX: 50,
  SKILL_DESCRIPTION_MIN: 10,
  SKILL_DESCRIPTION_MAX: 500,
  SKILL_CATEGORY_MIN: 2,
  SKILL_CATEGORY_MAX: 30,
  MESSAGE_MIN: 5,
  MESSAGE_MAX: 1000,
  FEEDBACK_MAX: 500,
  REASON_MIN: 5,
  REASON_MAX: 200
};

// Rate limiting
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  MESSAGE: 'Too many requests from this IP, please try again later.'
};

// JWT settings
const JWT_SETTINGS = {
  EXPIRES_IN: '7d',
  ALGORITHM: 'HS256'
};

// Skill categories (predefined)
const SKILL_CATEGORIES = [
  'Programming',
  'Design',
  'Marketing',
  'Writing',
  'Languages',
  'Music',
  'Art',
  'Photography',
  'Video Editing',
  'Business',
  'Finance',
  'Health & Fitness',
  'Cooking',
  'Crafts',
  'Technology',
  'Education',
  'Other'
];

// Common skill names for search suggestions
const COMMON_SKILLS = [
  'JavaScript', 'Python', 'Java', 'C++', 'HTML', 'CSS', 'React', 'Node.js',
  'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'UI/UX Design',
  'SEO', 'Social Media Marketing', 'Content Writing', 'Copywriting',
  'Spanish', 'French', 'German', 'Mandarin', 'English',
  'Guitar', 'Piano', 'Singing', 'Music Production',
  'Digital Art', 'Painting', 'Drawing', 'Sculpture',
  'Photography', 'Video Editing', 'Animation',
  'Project Management', 'Excel', 'PowerPoint', 'Data Analysis',
  'Accounting', 'Financial Planning', 'Investment',
  'Yoga', 'Fitness Training', 'Nutrition', 'Meditation',
  'Cooking', 'Baking', 'Meal Planning',
  'Knitting', 'Woodworking', 'Jewelry Making'
];

// Error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Access denied. Please login.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation failed.',
  SERVER_ERROR: 'Internal server error.',
  USER_NOT_FOUND: 'User not found.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_EXISTS: 'Email already exists.',
  SKILL_NOT_FOUND: 'Skill not found.',
  REQUEST_NOT_FOUND: 'Request not found.',
  ALREADY_RATED: 'You have already rated this request.',
  CANNOT_RATE_SELF: 'You cannot rate yourself.',
  FILE_TOO_LARGE: 'File too large. Maximum size is 5MB.',
  INVALID_FILE_TYPE: 'Only image files are allowed.',
  USER_BANNED: 'Your account has been banned.',
  INAPPROPRIATE_CONTENT: 'Content contains inappropriate material.'
};

// Success messages
const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  SKILL_ADDED: 'Skill added successfully.',
  SKILL_UPDATED: 'Skill updated successfully.',
  SKILL_DELETED: 'Skill deleted successfully.',
  REQUEST_SENT: 'Request sent successfully.',
  REQUEST_ACCEPTED: 'Request accepted successfully.',
  REQUEST_REJECTED: 'Request rejected successfully.',
  REQUEST_CANCELLED: 'Request cancelled successfully.',
  RATING_SUBMITTED: 'Rating submitted successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  USER_BANNED: 'User banned successfully.',
  USER_UNBANNED: 'User unbanned successfully.',
  SKILL_APPROVED: 'Skill approved successfully.',
  SKILL_REJECTED: 'Skill rejected successfully.'
};

module.exports = {
  USER_ROLES,
  REQUEST_STATUS,
  SKILL_STATUS,
  USER_AVAILABILITY,
  MESSAGE_TYPES,
  RATING_RANGE,
  FILE_LIMITS,
  PAGINATION,
  VALIDATION_LIMITS,
  RATE_LIMIT,
  JWT_SETTINGS,
  SKILL_CATEGORIES,
  COMMON_SKILLS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};