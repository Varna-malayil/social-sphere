/**
 * controllers/posts.js - Full CRUD for posts, likes, feed
 */

const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { content, tags, visibility } = req.body;
  const images = [];

  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      images.push({
        url: file.path || file.secure_url,
        publicId: file.filename || file.public_id,
      });
    });
  }

  if (!content && images.length === 0) {
    throw new ErrorResponse('Post must have content or at least one image', 400);
  }

  const post = await Post.create({
    author: req.user.id,
    content,
    images,
    tags: tags ? tags.split(',').map((t) => t.trim().toLowerCase()) : [],
    visibility: visibility || 'public',
  });

  await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: 1 } });

  const populated = await post.populate('author', 'username displayName avatar isVerified');

  res.status(201).json({ success: true, data: populated });
});

/**
 * @desc    Get home feed (posts from following + own)
 * @route   GET /api/posts/feed
 * @access  Private
 */
const getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const currentUser = await User.findById(req.user.id);
  const feedUserIds = [...currentUser.following, req.user.id];

  const total = await Post.countDocuments({
    author: { $in: feedUserIds },
    isDeleted: false,
    visibility: { $in: ['public', 'followers'] },
  });

  const posts = await Post.find({
    author: { $in: feedUserIds },
    isDeleted: false,
    visibility: { $in: ['public', 'followers'] },
  })
    .populate('author', 'username displayName avatar isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: posts,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
});

/**
 * @desc    Get all public posts (explore)
 * @route   GET /api/posts
 * @access  Public
 */
const getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, tag } = req.query;
  const query = { isDeleted: false, visibility: 'public' };
  if (tag) {
    const searchStr = tag.startsWith('#') ? tag.slice(1) : tag;
    const regex = { $regex: searchStr, $options: 'i' };
    query.$or = [
      { tags: regex },
      { content: regex }
    ];
  }
  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .populate('author', 'username displayName avatar isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
 
  res.json({
    success: true,
    data: posts,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
  

});

/**
 * @desc    Get a single post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, isDeleted: false }).populate(
    'author',
    'username displayName avatar isVerified bio'
  );
  if (!post) throw new ErrorResponse('Post not found', 404);
  res.json({ success: true, data: post });
});

/**
 * @desc    Get posts by a specific user
 * @route   GET /api/posts/user/:userId
 * @access  Public
 */
const getUserPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const query = {
    author: req.params.userId,
    isDeleted: false,
    visibility: 'public',
  };

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .populate('author', 'username displayName avatar isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, data: posts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

/**
 * @desc    Update a post
 * @route   PUT /api/posts/:id
 * @access  Private (owner only)
 */
const updatePost = asyncHandler(async (req, res) => {
  let post = await Post.findById(req.params.id);
  if (!post || post.isDeleted) throw new ErrorResponse('Post not found', 404);
  if (post.author.toString() !== req.user.id) throw new ErrorResponse('Not authorized', 403);

  const { content, tags, visibility } = req.body;
  post.content = content !== undefined ? content : post.content;
  post.visibility = visibility || post.visibility;
  if (tags) post.tags = tags.split(',').map((t) => t.trim().toLowerCase());

  await post.save();
  await post.populate('author', 'username displayName avatar isVerified');
  res.json({ success: true, data: post });
});

/**
 * @desc    Delete a post
 * @route   DELETE /api/posts/:id
 * @access  Private (owner or admin)
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.isDeleted) throw new ErrorResponse('Post not found', 404);

  const isOwner = post.author.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) throw new ErrorResponse('Not authorized', 403);

  post.isDeleted = true;
  post.deletedAt = new Date();
  post.deletedBy = req.user.id;
  await post.save();

  await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });

  res.json({ success: true, message: 'Post deleted successfully' });
});

/**
 * @desc    Like / Unlike a post
 * @route   PUT /api/posts/:id/like
 * @access  Private
 */
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
  if (!post) throw new ErrorResponse('Post not found', 404);

  const alreadyLiked = post.likes.includes(req.user.id);

  if (alreadyLiked) {
    post.likes.pull(req.user.id);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likes.push(req.user.id);
    post.likesCount += 1;

    // Notify post owner (not self-like)
    if (post.author.toString() !== req.user.id) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'like',
        post: post._id,
        message: `${req.user.username} liked your post`,
      });
      const io = req.app.get('io');
      io.to(post.author.toString()).emit('notification', notification);
    }
  }

  await post.save();
  res.json({ success: true, liked: !alreadyLiked, likesCount: post.likesCount });
});

module.exports = { createPost, getFeed, getPosts, getPost, getUserPosts, updatePost, deletePost, toggleLike };
