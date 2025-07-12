import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Flag,
  User,
  Clock,
  Eye,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

const QuestionDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  useEffect(() => {
    // TODO: Fetch question and answers from API
    // For now, using mock data
    setQuestion({
      id: id,
      title: 'How to implement authentication in React with JWT?',
      content: 'I\'m building a React application and need to implement user authentication using JWT tokens. I\'ve been looking at various tutorials but I\'m not sure about the best practices for token storage, refresh tokens, and handling authentication state. Can someone provide a comprehensive guide or point me to reliable resources?',
      author: {
        username: 'reactdev',
        avatar: null,
        reputation: 1250
      },
      tags: ['react', 'javascript', 'authentication', 'jwt'],
      votes: 15,
      views: 234,
      answers: 3,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    });

    setAnswers([
      {
        id: 1,
        content: 'Here\'s a comprehensive approach to JWT authentication in React:\n\n1. **Token Storage**: Use httpOnly cookies for security or localStorage for convenience\n2. **State Management**: Use Context API or Redux for auth state\n3. **Token Refresh**: Implement automatic token refresh\n4. **Route Protection**: Create protected route components',
        author: {
          username: 'auth_expert',
          avatar: null,
          reputation: 2100
        },
        votes: 8,
        isAccepted: true,
        createdAt: '2024-01-15T11:00:00Z'
      },
      {
        id: 2,
        content: 'I recommend using a library like Auth0 or Firebase Auth for production applications. They handle most of the security concerns for you.',
        author: {
          username: 'senior_dev',
          avatar: null,
          reputation: 1800
        },
        votes: 5,
        isAccepted: false,
        createdAt: '2024-01-15T12:30:00Z'
      }
    ]);

    setLoading(false);
  }, [id]);

  const handleVote = (type, itemId, itemType) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }
    
    // TODO: Implement voting logic
    toast.success(`${type === 'up' ? 'Upvoted' : 'Downvoted'} successfully`);
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please log in to answer');
      return;
    }

    if (!newAnswer.trim()) {
      toast.error('Please enter an answer');
      return;
    }

    setSubmittingAnswer(true);
    
    try {
      // TODO: Submit answer to API
      const answer = {
        id: Date.now(),
        content: newAnswer,
        author: {
          username: user.username,
          avatar: user.avatar,
          reputation: user.reputation
        },
        votes: 0,
        isAccepted: false,
        createdAt: new Date().toISOString()
      };
      
      setAnswers([...answers, answer]);
      setNewAnswer('');
      toast.success('Answer posted successfully!');
    } catch (error) {
      toast.error('Failed to post answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Not Found</h2>
          <p className="text-gray-600 mb-6">The question you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Question Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-4">
          {/* Voting */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => handleVote('up', question.id, 'question')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ThumbsUp className="h-5 w-5 text-gray-400" />
            </button>
            <span className="text-lg font-semibold text-gray-900">{question.votes}</span>
            <button
              onClick={() => handleVote('down', question.id, 'question')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ThumbsDown className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Question Content */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>
            
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{question.content}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {question.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Question Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <Link to={`/profile/${question.author.username}`} className="hover:text-primary-600">
                    {question.author.username}
                  </Link>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(question.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {question.views} views
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Bookmark className="h-4 w-4" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Flag className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
        </h2>

        {/* Answers List */}
        <div className="space-y-6">
          {answers.map((answer) => (
            <div key={answer.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start space-x-4">
                {/* Voting */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleVote('up', answer.id, 'answer')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ThumbsUp className="h-5 w-5 text-gray-400" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900">{answer.votes}</span>
                  <button
                    onClick={() => handleVote('down', answer.id, 'answer')}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ThumbsDown className="h-5 w-5 text-gray-400" />
                  </button>
                  {answer.isAccepted && (
                    <div className="mt-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Answer Content */}
                <div className="flex-1">
                  <div className="prose max-w-none mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{answer.content}</p>
                  </div>

                  {/* Answer Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <Link to={`/profile/${answer.author.username}`} className="hover:text-primary-600">
                          {answer.author.username}
                        </Link>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(answer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center hover:text-primary-600">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Comment
                      </button>
                      <button className="flex items-center hover:text-primary-600">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Your Answer */}
        {isAuthenticated && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
            <form onSubmit={handleSubmitAnswer}>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Write your answer here..."
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingAnswer}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingAnswer ? 'Posting...' : 'Post Answer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 mb-4">Please log in to answer this question.</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Sign in to Answer
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetail; 