import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
  User, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  MessageSquare, 
  ThumbsUp, 
  Eye,
  Edit,
  Settings,
  Bookmark,
  Activity
} from 'lucide-react';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');

  useEffect(() => {
    // TODO: Fetch user data from API
    // For now, using mock data
    setUser({
      username: username || 'reactdev',
      email: 'reactdev@example.com',
      bio: 'Full-stack developer passionate about React, Node.js, and building great user experiences. I love helping others learn and solve problems.',
      avatar: null,
      reputation: 1250,
      badges: ['Enthusiast', 'Commentator', 'Editor'],
      location: 'San Francisco, CA',
      website: 'https://reactdev.com',
      joined: '2023-01-15T10:30:00Z',
      lastSeen: '2024-01-15T14:30:00Z',
      questionsCount: 12,
      answersCount: 45,
      votesReceived: 234,
      views: 1234
    });

    setQuestions([
      {
        id: 1,
        title: 'How to implement authentication in React with JWT?',
        votes: 15,
        answers: 3,
        views: 234,
        createdAt: '2024-01-15T10:30:00Z',
        tags: ['react', 'javascript', 'authentication']
      },
      {
        id: 2,
        title: 'Best practices for state management in large React applications',
        votes: 8,
        answers: 2,
        views: 156,
        createdAt: '2024-01-10T14:20:00Z',
        tags: ['react', 'state-management', 'redux']
      }
    ]);

    setAnswers([
      {
        id: 1,
        questionTitle: 'How to use useEffect properly?',
        questionId: 123,
        content: 'Here\'s a comprehensive guide to useEffect...',
        votes: 12,
        isAccepted: true,
        createdAt: '2024-01-14T09:15:00Z'
      },
      {
        id: 2,
        questionTitle: 'React hooks vs class components',
        questionId: 124,
        content: 'Hooks provide a more functional approach...',
        votes: 8,
        isAccepted: false,
        createdAt: '2024-01-12T16:45:00Z'
      }
    ]);

    setLoading(false);
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
          <p className="text-gray-600 mb-6">The user you're looking for doesn't exist.</p>
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

  const isOwnProfile = isAuthenticated && currentUser?.username === user.username;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Profile Header */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {new Date(user.joined).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-1" />
                    Last seen {new Date(user.lastSeen).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {isOwnProfile && (
                <div className="flex space-x-2">
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 mb-4">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{user.reputation}</div>
                <div className="text-sm text-gray-500">Reputation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.questionsCount}</div>
                <div className="text-sm text-gray-500">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.answersCount}</div>
                <div className="text-sm text-gray-500">Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user.votesReceived}</div>
                <div className="text-sm text-gray-500">Votes</div>
              </div>
            </div>

            {/* Badges */}
            {user.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              {user.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {user.location}
                </div>
              )}
              {user.website && (
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-1" />
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600"
                  >
                    {user.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Questions ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('answers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'answers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Answers ({answers.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activity
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <Link
                    to={`/questions/${question.id}`}
                    className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-primary-600">
                      {question.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {question.votes} votes
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {question.answers} answers
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {question.views} views
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(question.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {question.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Answers Tab */}
          {activeTab === 'answers' && (
            <div className="space-y-4">
              {answers.map((answer) => (
                <div key={answer.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <Link
                    to={`/questions/${answer.questionId}`}
                    className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-primary-600">
                      {answer.questionTitle}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{answer.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {answer.votes} votes
                      </div>
                      {answer.isAccepted && (
                        <div className="flex items-center text-green-600">
                          <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-1">
                            <span className="text-white text-xs">✓</span>
                          </span>
                          Accepted
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(answer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Activity Feed</h3>
              <p className="mt-2 text-sm text-gray-500">
                Recent activity will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 