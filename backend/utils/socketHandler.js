/**
 * utils/socketHandler.js - Socket.IO event handling for chat and notifications
 */

const { socketAuth } = require('../middleware/auth');
const User = require('../models/User');

// Map of userId -> Set of socketIds (a user can have multiple tabs)
const onlineUsers = new Map();

module.exports = (io) => {
  // Apply auth middleware to all socket connections
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 Socket connected: ${socket.user.username} (${socket.id})`);

    // ── Track online status ──────────────────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user's personal room for notifications/DMs
    socket.join(userId);

    // Mark user as online in DB
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast to all followers that user came online
    io.emit('userOnline', { userId });

    // ── Chat Events ──────────────────────────────────────────────────────

    // Join a conversation room
    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Leave a conversation room
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('userTyping', {
        userId,
        username: socket.user.username,
        isTyping,
      });
    });

    // Message delivered acknowledgement
    socket.on('messageRead', ({ conversationId, messageId }) => {
      socket.to(`conversation:${conversationId}`).emit('messageRead', {
        messageId,
        readBy: userId,
        readAt: new Date(),
      });
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.user.username} (${socket.id})`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          // User has no more open connections — mark offline
          onlineUsers.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
          io.emit('userOffline', { userId, lastSeen: new Date() });
        }
      }
    });
  });
};
