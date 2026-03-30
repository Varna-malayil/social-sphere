/**
 * controllers/comments.js - CRUD for comments and replies
 */

const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get comments for a post
 * @route   GET /api/comments/:postId
 * @access  Public
 */
const getComments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const total = await Comment.countDocuments({
    post: req.params.postId,
    parentComment: null,
    isDeleted: false,
  });

  const comments = await Comment.find({
    post: req.params.postId,
    parentComment: null,
    isDeleted: false,
  })
    .populate('author', 'username displayName avatar isVerified')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: { path: 'author', select: 'username displayName avatar isVerified' },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: comments, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

/**
 * @desc    Add a comment to a post
 * @route   POST /api/comments/:postId
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
  const { content, parentCommentId } = req.body;

  const post = await Post.findOne({ _id: req.params.postId, isDeleted: false });
  if (!post) throw new ErrorResponse('Post not found', 404);

  const comment = await Comment.create({
    post: req.params.postId,
    author: req.user.id,
    content,
    parentComment: parentCommentId || null,
  });

  // If reply, add to parent's replies array
  if (parentCommentId) {
    await Comment.findByIdAndUpdate(parentCommentId, {
      $push: { replies: comment._id },
    });
  }

  // Increment post comment count
  await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });

  // Send notification to post author
  if (post.author.toString() !== req.user.id) {
    const notification = await Notification.create({
      recipient: post.author,
      sender: req.user.id,
      type: parentCommentId ? 'reply' : 'comment',
      post: post._id,
      comment: comment._id,
      message: `${req.user.username} ${parentCommentId ? 'replied to a comment on' : 'commented on'} your post`,
    });
    const io = req.app.get('io');
    io.to(post.author.toString()).emit('notification', notification);
  }

  await comment.populate('author', 'username displayName avatar isVerified');
  res.status(201).json({ success: true, data: comment });
});

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:id
 * @access  Private (owner only)
 */
const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) throw new ErrorResponse('Comment not found', 404);
  if (comment.author.toString() !== req.user.id) throw new ErrorResponse('Not authorized', 403);

  comment.content = req.body.content;
  await comment.save();
  await comment.populate('author', 'username displayName avatar isVerified');

  res.json({ success: true, data: comment });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private (owner or admin)
 */
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) throw new ErrorResponse('Comment not found', 404);

  const isOwner = comment.author.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new ErrorResponse('Not authorized', 403);

  comment.isDeleted = true;
  await comment.save();

  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

  res.json({ success: true, message: 'Comment deleted' });
});

/**
 * @desc    Like / Unlike a comment
 * @route   PUT /api/comments/:id/like
 * @access  Private
 */
const toggleLikeComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findOne({ _id: req.params.id, isDeleted: false });
  if (!comment) throw new ErrorResponse('Comment not found', 404);

  const alreadyLiked = comment.likes.includes(req.user.id);
  if (alreadyLiked) {
    comment.likes.pull(req.user.id);
    comment.likesCount = Math.max(0, comment.likesCount - 1);
  } else {
    comment.likes.push(req.user.id);
    comment.likesCount += 1;
  }
  await comment.save();

  res.json({ success: true, liked: !alreadyLiked, likesCount: comment.likesCount });
});

module.exports = { getComments, addComment, updateComment, deleteComment, toggleLikeComment };
