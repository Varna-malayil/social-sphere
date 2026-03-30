/**
 * models/Report.js - Report schema for content moderation
 */

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['post', 'comment', 'user'],
      required: true,
    },
    // References to reported content
    reportedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    reportedComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Report details
    reason: {
      type: String,
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'nudity',
        'misinformation',
        'copyright',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    // Admin review
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    adminNotes: String,
    actionTaken: {
      type: String,
      enum: ['none', 'content_removed', 'user_warned', 'user_banned'],
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporter: 1 });
ReportSchema.index({ reportedUser: 1 });

module.exports = mongoose.model('Report', ReportSchema);
