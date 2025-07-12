const Notification = require('../models/Notification');
const User = require('../models/User');

// Store connected users
const connectedUsers = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user authentication
    if (socket.user) {
      const userId = socket.user._id.toString();
      connectedUsers.set(userId, socket.id);
      
      // Update user's last active time
      User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec();
      
      console.log(`Authenticated user connected: ${socket.user.username} (${userId})`);
      
      // Join user to their personal room for notifications
      socket.join(`user:${userId}`);
      
      // Send unread notification count
      sendUnreadNotificationCount(socket, userId);
    }

    // Handle user joining question room
    socket.on('join-question', (questionId) => {
      socket.join(`question:${questionId}`);
      console.log(`User joined question room: ${questionId}`);
    });

    // Handle user leaving question room
    socket.on('leave-question', (questionId) => {
      socket.leave(`question:${questionId}`);
      console.log(`User left question room: ${questionId}`);
    });

    // Handle real-time typing indicator
    socket.on('typing-start', (data) => {
      const { questionId, answerId, type } = data;
      const room = answerId ? `answer:${answerId}` : `question:${questionId}`;
      
      socket.to(room).emit('user-typing', {
        userId: socket.user?._id,
        username: socket.user?.username,
        type: type // 'question', 'answer', 'comment'
      });
    });

    socket.on('typing-stop', (data) => {
      const { questionId, answerId } = data;
      const room = answerId ? `answer:${answerId}` : `question:${questionId}`;
      
      socket.to(room).emit('user-stopped-typing', {
        userId: socket.user?._id
      });
    });

    // Handle live question updates
    socket.on('question-updated', (data) => {
      const { questionId, updates } = data;
      socket.to(`question:${questionId}`).emit('question-updated', {
        questionId,
        updates,
        updatedBy: socket.user?._id,
        updatedAt: new Date()
      });
    });

    // Handle live answer updates
    socket.on('answer-updated', (data) => {
      const { answerId, questionId, updates } = data;
      socket.to(`question:${questionId}`).emit('answer-updated', {
        answerId,
        updates,
        updatedBy: socket.user?._id,
        updatedAt: new Date()
      });
    });

    // Handle new comment
    socket.on('new-comment', (data) => {
      const { questionId, answerId, comment } = data;
      const room = answerId ? `answer:${answerId}` : `question:${questionId}`;
      
      socket.to(room).emit('comment-added', {
        comment,
        addedBy: socket.user?._id,
        addedAt: new Date()
      });
    });

    // Handle vote updates
    socket.on('vote-updated', (data) => {
      const { questionId, answerId, voteType, newCount } = data;
      const room = answerId ? `question:${questionId}` : `question:${questionId}`;
      
      socket.to(room).emit('vote-updated', {
        questionId,
        answerId,
        voteType,
        newCount,
        votedBy: socket.user?._id,
        votedAt: new Date()
      });
    });

    // Handle answer acceptance
    socket.on('answer-accepted', (data) => {
      const { questionId, answerId } = data;
      socket.to(`question:${questionId}`).emit('answer-accepted', {
        questionId,
        answerId,
        acceptedBy: socket.user?._id,
        acceptedAt: new Date()
      });
    });

    // Handle user presence
    socket.on('user-online', () => {
      if (socket.user) {
        const userId = socket.user._id.toString();
        socket.broadcast.emit('user-status-changed', {
          userId,
          status: 'online',
          username: socket.user.username
        });
      }
    });

    // Handle private messages (for admin notifications)
    socket.on('send-private-message', (data) => {
      const { recipientId, message } = data;
      
      if (socket.user && socket.user.role === 'admin') {
        const recipientSocketId = connectedUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('private-message', {
            from: socket.user._id,
            fromUsername: socket.user.username,
            message,
            sentAt: new Date()
          });
        }
      }
    });

    // Handle notification read status
    socket.on('mark-notification-read', async (data) => {
      const { notificationId } = data;
      
      if (socket.user) {
        try {
          const notification = await Notification.findById(notificationId);
          if (notification && notification.recipient.toString() === socket.user._id.toString()) {
            await notification.markAsRead();
            socket.emit('notification-read', { notificationId });
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    });

    // Handle mark all notifications as read
    socket.on('mark-all-notifications-read', async () => {
      if (socket.user) {
        try {
          await Notification.markAllAsRead(socket.user._id);
          socket.emit('all-notifications-read');
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
        }
      }
    });

    // Handle user activity tracking
    socket.on('user-activity', (data) => {
      if (socket.user) {
        const { activity, page, timestamp } = data;
        
        // Update user's last active time
        User.findByIdAndUpdate(socket.user._id, { 
          lastActive: new Date(timestamp) 
        }).exec();
        
        // Log activity for analytics (in production, you might want to store this)
        console.log(`User activity: ${socket.user.username} - ${activity} on ${page}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      if (socket.user) {
        const userId = socket.user._id.toString();
        connectedUsers.delete(userId);
        
        // Update user's last active time
        User.findByIdAndUpdate(userId, { lastActive: new Date() }).exec();
        
        // Notify other users about offline status
        socket.broadcast.emit('user-status-changed', {
          userId,
          status: 'offline',
          username: socket.user.username
        });
      }
    });
  });
};

// Helper function to send unread notification count
const sendUnreadNotificationCount = async (socket, userId) => {
  try {
    const count = await Notification.getUnreadCount(userId);
    socket.emit('unread-notifications-count', { count });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
  }
};

// Function to send notification to user
const sendNotificationToUser = async (userId, notificationData) => {
  try {
    const notification = await Notification.createNotification(notificationData);
    
    // Send to connected user if online
    const userSocketId = connectedUsers.get(userId.toString());
    if (userSocketId) {
      const io = require('../server').io;
      io.to(userSocketId).emit('new-notification', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt
        }
      });
      
      // Update unread count
      const count = await Notification.getUnreadCount(userId);
      io.to(userSocketId).emit('unread-notifications-count', { count });
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending notification to user:', error);
    throw error;
  }
};

// Function to broadcast to question room
const broadcastToQuestion = (questionId, event, data) => {
  const io = require('../server').io;
  io.to(`question:${questionId}`).emit(event, data);
};

// Function to broadcast to answer room
const broadcastToAnswer = (answerId, event, data) => {
  const io = require('../server').io;
  io.to(`answer:${answerId}`).emit(event, data);
};

// Function to get online users count
const getOnlineUsersCount = () => {
  return connectedUsers.size;
};

// Function to get online users list
const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};

// Function to check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

// Function to send system message to all users
const broadcastSystemMessage = (message, type = 'info') => {
  const io = require('../server').io;
  io.emit('system-message', {
    message,
    type,
    timestamp: new Date()
  });
};

// Function to send admin message to specific user
const sendAdminMessage = (userId, message) => {
  const userSocketId = connectedUsers.get(userId.toString());
  if (userSocketId) {
    const io = require('../server').io;
    io.to(userSocketId).emit('admin-message', {
      message,
      timestamp: new Date()
    });
  }
};

module.exports = {
  setupSocketHandlers,
  sendNotificationToUser,
  broadcastToQuestion,
  broadcastToAnswer,
  getOnlineUsersCount,
  getOnlineUsers,
  isUserOnline,
  broadcastSystemMessage,
  sendAdminMessage
}; 