const express = require('express');
const router = express.Router();
const {
  createPost, getFeed, getPosts, getPost,
  getUserPosts, updatePost, deletePost, toggleLike,
} = require('../controllers/posts');
const { protect } = require('../middleware/auth');
const { postValidation } = require('../middleware/validate');
const { uploadPost } = require('../config/cloudinary');

router.get('/feed', protect, getFeed);
router.get('/user/:userId', getUserPosts);
router.route('/')
  .get(getPosts)
  .post(protect, uploadPost.array('images', 4), postValidation, createPost);
router.route('/:id')
  .get(getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);
router.put('/:id/like', protect, toggleLike);

module.exports = router;
