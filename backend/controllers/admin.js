/**
 * controllers/admin.js - Full admin panel functionality
 */

const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { Message } = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get platform analytics dashboard
 * @route   GET /api/admin/analytics
 * @access  Admin
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const last30Days = new Date(now.setDate(now.getDate() - 30));
  const last7Days = new Date(new Date().setDate(new Date().getDate() - 7));

  const [
    totalUsers,
    newUsersLast30,
    newUsersLast7,
    totalPosts,
    newPostsLast30,
    totalReports,
    pendingReports,
    bannedUsers,
    activeUsers,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'user', createdAt: { $gte: last30Days } }),
    User.countDocuments({ role: 'user', createdAt: { $gte: last7Days } }),
    Post.countDocuments({ isDeleted: false }),
    Post.countDocuments({ isDeleted: false, createdAt: { $gte: last30Days } }),
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ isOnline: true }),
  ]);

  // Daily signups for the last 30 days
  const dailySignups = await User.aggregate([
    { $match: { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Daily posts for the last 30 days
  const dailyPosts = await Post.aggregate([
    { $match: { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }, isDeleted: false } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Top users by followers
  const topUsers = await User.find({ isBanned: false })
    .select('username displayName avatar followersCount postsCount')
    .sort({ followersCount: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, last30Days: newUsersLast30, last7Days: newUsersLast7, banned: bannedUsers, active: activeUsers },
      posts: { total: totalPosts, last30Days: newPostsLast30 },
      reports: { total: totalReports, pending: pendingReports },
      charts: { dailySignups, dailyPosts },
      topUsers,
    },
  });
});

/**
 * @desc    Get all users with filtering
 * @route   GET /api/admin/users
 * @access  Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;

  const query = { role: 'user' };
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
    ];
  }
  if (status === 'banned') query.isBanned = true;
  if (status === 'active') query.isBanned = false;

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

/**
 * @desc    Ban or unban a user
 * @route   PUT /api/admin/users/:id/ban
 * @access  Admin
 */
const toggleBanUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) throw new ErrorResponse('User not found', 404);
  if (user.role === 'admin') throw new ErrorResponse('Cannot ban an admin', 400);

  user.isBanned = !user.isBanned;
  user.banReason = user.isBanned ? reason : undefined;
  await user.save({ validateBeforeSave: false });

  // Notify user
  if (user.isBanned) {
    await Notification.create({
      recipient: user._id,
      sender: req.user.id,
      type: 'system',
      message: `Your account has been banned. Reason: ${reason || 'Violation of community guidelines'}`,
    });
  }

  res.json({
    success: true,
    message: user.isBanned ? `User ${user.username} has been banned` : `User ${user.username} has been unbanned`,
    data: { isBanned: user.isBanned },
  });
});

/**
 * @desc    Get all reports
 * @route   GET /api/admin/reports
 * @access  Admin
 */
const getReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};

  const total = await Report.countDocuments(query);
  const reports = await Report.find(query)
    .populate('reporter', 'username avatar')
    .populate('reportedPost', 'content images author')
    .populate('reportedUser', 'username avatar email')
    .populate('reportedComment', 'content author')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: reports, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

/**
 * @desc    Resolve a report
 * @route   PUT /api/admin/reports/:id/resolve
 * @access  Admin
 */
const resolveReport = asyncHandler(async (req, res) => {
  const { status, actionTaken, adminNotes } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) throw new ErrorResponse('Report not found', 404);

  report.status = status;
  report.actionTaken = actionTaken;
  report.adminNotes = adminNotes;
  report.reviewedBy = req.user.id;
  report.reviewedAt = new Date();
  await report.save();

  // Take action based on resolution
  if (actionTaken === 'content_removed' && report.reportedPost) {
    await Post.findByIdAndUpdate(report.reportedPost, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user.id,
    });
  }

  res.json({ success: true, data: report, message: 'Report resolved' });
});

/**
 * @desc    Admin delete any post
 * @route   DELETE /api/admin/posts/:id
 * @access  Admin
 */
const adminDeletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw new ErrorResponse('Post not found', 404);

  post.isDeleted = true;
  post.deletedAt = new Date();
  post.deletedBy = req.user.id;
  await post.save();

  // Notify post author
  await Notification.create({
    recipient: post.author,
    sender: req.user.id,
    type: 'system',
    message: 'Your post has been removed for violating community guidelines',
  });

  res.json({ success: true, message: 'Post removed by admin' });
});

/**
 * @desc    Get all posts with moderation info
 * @route   GET /api/admin/posts
 * @access  Admin
 */
const getAllPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, reported } = req.query;
  const query = { isDeleted: false };
  if (reported === 'true') query.isReported = true;

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .populate('author', 'username displayName avatar')
    .sort({ reportCount: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: posts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

module.exports = { getAnalytics, getAllUsers, toggleBanUser, getReports, resolveReport, adminDeletePost, getAllPosts };
