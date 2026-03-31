/**
 * controllers/users.js - User profile management, follow/unfollow, search
 */

const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get user profile by username
 * @route   GET /api/users/:username
 * @access  Public
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select('-password -email')
    .populate('followers', 'username avatar displayName')
    .populate('following', 'username avatar displayName');

  if (!user) throw new ErrorResponse('User not found', 404);

  res.json({ success: true, data: user });
});

/**
 * @desc    Update current user's profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { displayName, bio, website, location } = req.body;

  const updateData = {};

  //  Only update fields if they are provided
  if (displayName !== undefined) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (website !== undefined) updateData.website = website;
  if (location !== undefined) updateData.location = location;

  //  Handle avatar
  if (req.file) {
    updateData.avatar = req.file.path || req.file.secure_url;
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updateData }, //  IMPORTANT
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  res.json({ success: true, data: user });
});

/**
 * @desc    Follow a user
 * @route   POST /api/users/:id/follow
 * @access  Private
 */
const followUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id.toString()) {
    throw new ErrorResponse('You cannot follow yourself', 400);
  }

  const userToFollow = await User.findById(req.params.id);
  if (!userToFollow) throw new ErrorResponse('User not found', 404);

  const currentUser = await User.findById(req.user.id);
  const alreadyFollowing = currentUser.following.includes(req.params.id);

  if (alreadyFollowing) {
    // Unfollow
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { following: req.params.id },
      $inc: { followingCount: -1 },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user.id },
      $inc: { followersCount: -1 },
    });
    return res.json({ success: true, following: false, message: 'Unfollowed successfully' });
  } else {
    // Follow
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { following: req.params.id },
      $inc: { followingCount: 1 },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $addToSet: { followers: req.user.id },
      $inc: { followersCount: 1 },
    });

    // Create notification
    const notification = await Notification.create({
      recipient: req.params.id,
      sender: req.user.id,
      type: 'follow',
      message: `${req.user.username} started following you`,
    });

    // Emit real-time notification
    const io = req.app.get('io');
    io.to(req.params.id).emit('notification', notification);

    return res.json({ success: true, following: true, message: 'Followed successfully' });
  }
});

/**
 * @desc    Search users
 * @route   GET /api/users/search?q=query
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: [], total: 0 });
  }

  const query = {
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { displayName: { $regex: q, $options: 'i' } },
    ],
    _id: { $ne: req.user.id },
    isBanned: false,
  };

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('username displayName avatar bio followersCount isVerified')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: users, total, page: parseInt(page) });
});

/**
 * @desc    Get suggested users to follow
 * @route   GET /api/users/suggestions
 * @access  Private
 */
const getSuggestions = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user.id);
  const excludeIds = [...currentUser.following, req.user.id];

  const users = await User.find({ _id: { $nin: excludeIds }, isBanned: false })
    .select('username displayName avatar bio followersCount isVerified')
    .sort({ followersCount: -1 })
    .limit(5);

  res.json({ success: true, data: users });
});

/**
 * @desc    Get user's followers list
 * @route   GET /api/users/:id/followers
 * @access  Public
 */
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    'followers',
    'username displayName avatar bio followersCount isVerified'
  );
  if (!user) throw new ErrorResponse('User not found', 404);
  res.json({ success: true, data: user.followers });
});

/**
 * @desc    Get user's following list
 * @route   GET /api/users/:id/following
 * @access  Public
 */
const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    'following',
    'username displayName avatar bio followersCount isVerified'
  );
  if (!user) throw new ErrorResponse('User not found', 404);
  res.json({ success: true, data: user.following });
});

module.exports = {
  getUserProfile,
  updateProfile,
  followUser,
  searchUsers,
  getSuggestions,
  getFollowers,
  getFollowing,
};
