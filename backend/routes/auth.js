const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validate');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
