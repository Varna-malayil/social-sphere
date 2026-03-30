/**
 * models/Post.js - Post schema with rich content support
 */

const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      maxlength: [2000, 'Post content cannot exceed 2000 characters'],
    },
    images: [
      {
        url: String,
        publicId: String, // Cloudinary public ID for deletion
      },
    ],
    // Engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    // Metadata
    tags: [{ type: String, lowercase: true, trim: true }],
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    // Moderation
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Optional: repost/quote support
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    isRepost: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ likesCount: -1 });

// Virtual: check if post has content or images
PostSchema.virtual('hasContent').get(function () {
  return !!(this.content || (this.images && this.images.length > 0));
});

// Validate: must have content or at least one image
PostSchema.pre('validate', function (next) {
  if (!this.content && (!this.images || this.images.length === 0)) {
    this.invalidate('content', 'Post must have either content or at least one image');
  }
  next();
});

module.exports = mongoose.model('Post', PostSchema);
