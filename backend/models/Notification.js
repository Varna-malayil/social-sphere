/**
 * models/Notification.js - Notification schema for all platform events
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'like',         // Someone liked your post
        'comment',      // Someone commented on your post
        'follow',       // Someone followed you
        'mention',      // Someone mentioned you
        'reply',        // Someone replied to your comment
        'repost',       // Someone reposted your post
        'message',      // New direct message
        'system',       // System notification
      ],
      required: true,
    },
    // References to relevant content
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    // Message content
    message: {
      type: String,
      maxlength: [500, 'Notification message cannot exceed 500 characters'],
    },
    // Read status
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
