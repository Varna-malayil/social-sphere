// routes/comments.js
const express = require('express');
const router = express.Router();
const { getComments, addComment, updateComment, deleteComment, toggleLikeComment } = require('../controllers/comments');
const { protect } = require('../middleware/auth');
const { commentValidation } = require('../middleware/validate');

router.get('/:postId', getComments);
router.post('/:postId', protect, commentValidation, addComment);
router.put('/:id', protect, commentValidation, updateComment);
router.delete('/:id', protect, deleteComment);
router.put('/:id/like', protect, toggleLikeComment);

module.exports = router;
