/**
 * controllers/reports.js - Content reporting system
 */

const Report = require('../models/Report');
const Post = require('../models/Post');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Submit a report
 * @route   POST /api/reports
 * @access  Private
 */
const createReport = asyncHandler(async (req, res) => {
  const { reportType, reportedPost, reportedComment, reportedUser, reason, description } = req.body;

  // Prevent duplicate reports from the same user
  const existingReport = await Report.findOne({
    reporter: req.user.id,
    reportType,
    ...(reportedPost && { reportedPost }),
    ...(reportedComment && { reportedComment }),
    ...(reportedUser && { reportedUser }),
    status: 'pending',
  });

  if (existingReport) {
    throw new ErrorResponse('You have already reported this content', 400);
  }

  const report = await Report.create({
    reporter: req.user.id,
    reportType,
    reportedPost,
    reportedComment,
    reportedUser,
    reason,
    description,
  });

  // Mark post as reported
  if (reportedPost) {
    await Post.findByIdAndUpdate(reportedPost, {
      $inc: { reportCount: 1 },
      isReported: true,
    });
  }

  res.status(201).json({ success: true, data: report, message: 'Report submitted successfully' });
});

/**
 * @desc    Get user's own reports
 * @route   GET /api/reports/mine
 * @access  Private
 */
const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user.id })
    .populate('reportedPost', 'content')
    .populate('reportedUser', 'username avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: reports });
});

module.exports = { createReport, getMyReports };
