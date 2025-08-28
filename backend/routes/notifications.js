const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const { sendSuccessResponse, sendErrorResponse, asyncHandler } = require('../middleware/errorHandler');
const Notification = require('../models/Notification');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const skip = (page - 1) * limit;

  const notifications = await Notification.getUserNotifications(
    req.user._id, 
    parseInt(page), 
    parseInt(limit), 
    unreadOnly === 'true'
  );

  const total = await Notification.countDocuments({ recipient: req.user._id });
  const unreadCount = await Notification.getUnreadCount(req.user._id);

  sendSuccessResponse(res, {
    notifications,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      hasNext: skip + notifications.length < total,
      hasPrev: page > 1
    },
    unreadCount
  });
}));

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const unreadCount = await Notification.getUnreadCount(req.user._id);
  
  sendSuccessResponse(res, { unreadCount });
}));

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, validateId, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return sendErrorResponse(res, {
      message: 'Notification not found',
      statusCode: 404
    });
  }

  // Check ownership
  if (notification.recipient.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, {
      message: 'You can only mark your own notifications as read',
      statusCode: 403
    });
  }

  await notification.markAsRead();

  sendSuccessResponse(res, { notification }, 'Notification marked as read');
}));

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.markAllAsRead(req.user._id);

  sendSuccessResponse(res, {}, 'All notifications marked as read');
}));

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, validateId, asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return sendErrorResponse(res, {
      message: 'Notification not found',
      statusCode: 404
    });
  }

  // Check ownership
  if (notification.recipient.toString() !== req.user._id.toString()) {
    return sendErrorResponse(res, {
      message: 'You can only delete your own notifications',
      statusCode: 403
    });
  }

  await notification.remove();

  sendSuccessResponse(res, {}, 'Notification deleted successfully');
}));

module.exports = router; 