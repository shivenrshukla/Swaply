const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  validate
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Skill validation
const validateSkill = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Skill name must be between 2 and 50 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Category must be between 2 and 30 characters'),
  validate
];

// Request validation
const validateRequest = [
  body('skillOffered')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill offered must be between 2 and 100 characters'),
  body('skillWanted')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Skill wanted must be between 2 and 100 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must be less than 500 characters'),
  validate
];

// Rating validation
const validateRating = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback must be less than 500 characters'),
  validate
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('availability')
    .optional()
    .isIn(['Available', 'Busy', 'Unavailable'])
    .withMessage('Availability must be Available, Busy, or Unavailable'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  validate
];

// Message validation
const validateMessage = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('content')
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Content must be between 5 and 1000 characters'),
  body('type')
    .optional()
    .isIn(['message', 'announcement', 'warning', 'update'])
    .withMessage('Type must be message, announcement, warning, or update'),
  validate
];

// Admin validation
const validateAdminAction = [
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters'),
  validate
];

module.exports = {
  validate,
  validateUserRegistration,
  validateUserLogin,
  validateSkill,
  validateRequest,
  validateRating,
  validateProfileUpdate,
  validateMessage,
  validateAdminAction
};