const express = require('express');
const router = express.Router();
const { createReport, getMyReports } = require('../controllers/reports');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReport);
router.get('/mine', protect, getMyReports);

module.exports = router;
