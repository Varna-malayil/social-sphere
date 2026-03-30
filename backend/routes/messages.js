const express = require('express');
const router = express.Router();
const { getConversations, getOrCreateConversation, getMessages, sendMessage, deleteMessage } = require('../controllers/messages');
const { protect } = require('../middleware/auth');
const { messageValidation } = require('../middleware/validate');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, getOrCreateConversation);
router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, messageValidation, sendMessage);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;
