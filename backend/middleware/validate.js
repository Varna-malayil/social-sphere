/**
 * middleware/validate.js - Input validation using express-validator
 */

const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Validation Rules ─────────────────────────────────────────────────────────

const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, underscores'),
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const postValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Post cannot exceed 2000 characters'),
  validate,
];

const commentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  validate,
];

const messageValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
  validate,
];

const profileValidation = [
  body('displayName').optional().trim().isLength({ max: 50 }).withMessage('Display name too long'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio too long'),
  body('website').optional().isURL().withMessage('Please enter a valid URL'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location too long'),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  postValidation,
  commentValidation,
  messageValidation,
  profileValidation,
};
