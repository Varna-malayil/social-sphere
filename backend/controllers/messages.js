/**
 * controllers/messages.js - Direct messaging with conversation management
 */

const { Message, Conversation } = require('../models/Message');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all conversations for the current user
 * @route   GET /api/messages/conversations
 * @access  Private
 */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user.id,
  })
    .populate('participants', 'username displayName avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1 });

  res.json({ success: true, data: conversations });
});

/**
 * @desc    Get or create a conversation with a user
 * @route   POST /api/messages/conversations
 * @access  Private
 */
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (userId === req.user.id.toString()) {
    throw new ErrorResponse('Cannot message yourself', 400);
  }

  const otherUser = await User.findById(userId);
  if (!otherUser) throw new ErrorResponse('User not found', 404);

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, userId] },
    isGroup: false,
  }).populate('participants', 'username displayName avatar isOnline lastSeen');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, userId],
      unreadCounts: [
        { user: req.user.id, count: 0 },
        { user: userId, count: 0 },
      ],
    });
    conversation = await conversation.populate('participants', 'username displayName avatar isOnline lastSeen');
  }

  res.json({ success: true, data: conversation });
});

/**
 * @desc    Get messages in a conversation
 * @route   GET /api/messages/:conversationId
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const { conversationId } = req.params;

  // Ensure user is a participant
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: req.user.id,
  });
  if (!conversation) throw new ErrorResponse('Conversation not found', 404);

  const total = await Message.countDocuments({
    conversation: conversationId,
    isDeleted: false,
    deletedFor: { $ne: req.user.id },
  });

  const messages = await Message.find({
    conversation: conversationId,
    isDeleted: false,
    deletedFor: { $ne: req.user.id },
  })
    .populate('sender', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  // Mark messages as read
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id },
    },
    { $addToSet: { readBy: { user: req.user.id, readAt: new Date() } } }
  );

  // Reset unread count
  await Conversation.updateOne(
    { _id: conversationId, 'unreadCounts.user': req.user.id },
    { $set: { 'unreadCounts.$.count': 0 } }
  );

  res.json({
    success: true,
    data: messages.reverse(),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
});

/**
 * @desc    Send a message
 * @route   POST /api/messages/:conversationId
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { conversationId } = req.params;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: req.user.id,
  });
  if (!conversation) throw new ErrorResponse('Conversation not found', 404);

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user.id,
    content,
    readBy: [{ user: req.user.id, readAt: new Date() }],
  });

  await message.populate('sender', 'username displayName avatar');

  // Update conversation last message
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: message._id,
    lastMessageText: content.substring(0, 100),
    lastMessageAt: new Date(),
    $inc: {
      'unreadCounts.$[elem].count': 1,
    },
  }, {
    arrayFilters: [{ 'elem.user': { $ne: req.user.id } }],
  });

  // Emit via Socket.IO
  const io = req.app.get('io');
  conversation.participants.forEach((participantId) => {
    if (participantId.toString() !== req.user.id.toString()) {
      io.to(participantId.toString()).emit('newMessage', {
        message,
        conversationId,
      });
    }
  });

  res.status(201).json({ success: true, data: message });
});

/**
 * @desc    Delete a message (for the sender)
 * @route   DELETE /api/messages/:messageId
 * @access  Private
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) throw new ErrorResponse('Message not found', 404);
  if (message.sender.toString() !== req.user.id) throw new ErrorResponse('Not authorized', 403);

  message.isDeleted = true;
  await message.save();

  res.json({ success: true, message: 'Message deleted' });
});

module.exports = { getConversations, getOrCreateConversation, getMessages, sendMessage, deleteMessage };
