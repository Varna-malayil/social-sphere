const express = require('express');
const router = express.Router();
const {
  getUserProfile, updateProfile, followUser,
  searchUsers, getSuggestions, getFollowers, getFollowing,
} = require('../controllers/users');
const { protect } = require('../middleware/auth');
const { profileValidation } = require('../middleware/validate');
const { uploadAvatar } = require('../config/cloudinary');

router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getSuggestions);
router.put('/profile', protect, uploadAvatar.single('avatar'), profileValidation, updateProfile);
router.get('/:username', getUserProfile);
router.post('/:id/follow', protect, followUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;
