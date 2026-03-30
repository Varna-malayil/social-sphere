/**
 * controllers/auth.js - Authentication controller (register, login, me, logout)
 */

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { username, email, password, displayName } = req.body;

  const user = await User.create({ username, email, password, displayName });
  sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  if (user.isBanned) {
    throw new ErrorResponse(`Account banned: ${user.banReason || 'Terms violation'}`, 403);
  }

  // Update last seen
  user.lastSeen = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate('followers', 'username avatar displayName')
    .populate('following', 'username avatar displayName');

  res.json({ success: true, data: user });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw new ErrorResponse('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const userData = {
    _id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({ success: true, token, data: userData });
};

module.exports = { register, login, getMe, updatePassword };
