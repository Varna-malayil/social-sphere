const express = require('express');
const router = express.Router();
const { getAnalytics, getAllUsers, toggleBanUser, getReports, resolveReport, adminDeletePost, getAllPosts } = require('../controllers/admin');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);
router.get('/posts', getAllPosts);
router.delete('/posts/:id', adminDeletePost);
router.get('/reports', getReports);
router.put('/reports/:id/resolve', resolveReport);

module.exports = router;
