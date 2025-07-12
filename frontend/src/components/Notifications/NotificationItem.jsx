import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  User, 
  CheckCircle,
  Flag,
  Star,
  Gift,
  AlertCircle,
  Clock
} from 'lucide-react';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'comment_posted':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'answer_posted':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'answer_accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'question_voted':
      case 'answer_voted':
        return notification.data?.voteType === 'upvote' 
          ? <ThumbsUp className="h-5 w-5 text-green-500" />
          : <ThumbsDown className="h-5 w-5 text-red-500" />;
      case 'user_mentioned':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'question_closed':
        return <Flag className="h-5 w-5 text-red-500" />;
      case 'question_featured':
        return <Star className="h-5 w-5 text-yellow-500" />;
      case 'bounty_added':
        return <Gift className="h-5 w-5 text-orange-500" />;
      case 'admin_message':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLink = () => {
    if (notification.data?.questionId) {
      return `/questions/${notification.data.questionId}`;
    }
    return '#';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div 
      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
      onClick={() => {
        if (!notification.isRead && onMarkAsRead) {
          onMarkAsRead(notification._id);
        }
      }}
    >
      <Link to={getLink()} className="block">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {formatTime(notification.createdAt)}
                </span>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {notification.message}
            </p>
            
            {notification.sender && (
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <User className="h-3 w-3 mr-1" />
                <span>{notification.sender.username}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NotificationItem; 