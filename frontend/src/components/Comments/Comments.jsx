import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  User, 
  Clock,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import toast from 'react-hot-toast';

const Comments = ({ questionId, answerId, onCommentAdded }) => {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [votedComments, setVotedComments] = useState(() => {
    const saved = localStorage.getItem('votedComments');
    return saved ? new Map(JSON.parse(saved)) : new Map();
  });

  useEffect(() => {
    if (questionId || answerId) {
      fetchComments();
    }
  }, [questionId, answerId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const endpoint = questionId 
        ? `/api/comments/question/${questionId}`
        : `/api/comments/answer/${answerId}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please log in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newComment.trim(),
          questionId: questionId || null,
          answerId: answerId || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        toast.success('Comment posted successfully!');
        
        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded(data.comment);
        }
      } else {
        let errorMessage = 'Failed to post comment';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.error('Could not parse error response:', textError);
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId, voteType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }

    // Check if user has already voted on this comment
    if (votedComments.has(commentId)) {
      toast.error('You have already voted on this comment');
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ voteType })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update comment vote count
        setComments(prev => prev.map(comment => 
          comment._id === commentId 
            ? { ...comment, voteCount: data.voteCount }
            : comment
        ));

        // Mark as voted
        const newVotedComments = new Map(votedComments);
        newVotedComments.set(commentId, voteType);
        setVotedComments(newVotedComments);
        localStorage.setItem('votedComments', JSON.stringify(Array.from(newVotedComments.entries())));

        toast.success(`${voteType === 'upvote' ? 'Upvoted' : 'Downvoted'} successfully`);
      } else {
        let errorMessage = 'Failed to vote';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.error('Could not parse error response:', textError);
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
      toast.error('Failed to vote on comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
        toast.success('Comment deleted successfully');
      } else {
        let errorMessage = 'Failed to delete comment';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            errorMessage = text || errorMessage;
          } catch (textError) {
            console.error('Could not parse error response:', textError);
          }
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.filter(Boolean).map((comment) => (
            <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {/* Voting */}
                <div className="flex flex-col items-center space-y-1">
                  <button
                    onClick={() => handleVote(comment._id, 'upvote')}
                    className={`p-1 rounded transition-colors ${
                      votedComments.get(comment._id) === 'upvote'
                        ? 'bg-green-100 text-green-600 cursor-not-allowed' 
                        : 'hover:bg-gray-200 text-gray-400 hover:text-green-600'
                    }`}
                    title="Upvote"
                    disabled={!!votedComments.get(comment._id)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-900">{comment.voteCount || 0}</span>
                  <button
                    onClick={() => handleVote(comment._id, 'downvote')}
                    className={`p-1 rounded transition-colors ${
                      votedComments.get(comment._id) === 'downvote'
                        ? 'bg-red-100 text-red-600 cursor-not-allowed' 
                        : 'hover:bg-gray-200 text-gray-400 hover:text-red-600'
                    }`}
                    title="Downvote"
                    disabled={!!votedComments.get(comment._id)}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="text-gray-700 mb-2">{comment.content}</div>
                  
                  {/* Comment Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span className="hover:text-primary-600 cursor-pointer">
                          {comment.author?.username || 'Anonymous'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {user && comment.author?._id === user._id && (
                        <>
                          <button 
                            className="hover:text-primary-600"
                            title="Edit comment"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteComment(comment._id)}
                            className="hover:text-red-600"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      <button className="hover:text-gray-700" title="Flag comment">
                        <Flag className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      {isAuthenticated && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Add a comment</h3>
          <form onSubmit={handleSubmitComment}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment here (minimum 15 characters)..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows="3"
              minLength="15"
              maxLength="1000"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500">
                {newComment.length}/1000 characters
              </span>
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isAuthenticated && (
        <div className="text-center py-4">
          <p className="text-gray-600">
            Please <a href="/login" className="text-primary-600 hover:underline">log in</a> to add a comment.
          </p>
        </div>
      )}
    </div>
  );
};

export default Comments; 