import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Tag, 
  User, 
  Clock, 
  Eye, 
  MessageSquare, 
  ThumbsUp 
} from 'lucide-react';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    // TODO: Fetch questions from API
    // For now, using mock data
    const mockQuestions = [
      {
        id: 1,
        title: 'How to implement authentication in React with JWT?',
        content: 'I\'m building a React application and need to implement user authentication using JWT tokens...',
        author: {
          username: 'reactdev',
          reputation: 1250
        },
        tags: ['react', 'javascript', 'authentication', 'jwt'],
        votes: 15,
        answers: 3,
        views: 234,
        createdAt: '2024-01-15T10:30:00Z',
        isAnswered: true
      },
      {
        id: 2,
        title: 'Best practices for state management in large React applications',
        content: 'I\'m working on a large React application and need advice on state management...',
        author: {
          username: 'senior_dev',
          reputation: 2100
        },
        tags: ['react', 'state-management', 'redux', 'context'],
        votes: 8,
        answers: 2,
        views: 156,
        createdAt: '2024-01-14T14:20:00Z',
        isAnswered: false
      },
      {
        id: 3,
        title: 'How to optimize performance in React applications?',
        content: 'My React app is getting slow with large datasets. What are the best optimization techniques?',
        author: {
          username: 'perf_expert',
          reputation: 1800
        },
        tags: ['react', 'performance', 'optimization'],
        votes: 12,
        answers: 5,
        views: 189,
        createdAt: '2024-01-13T09:15:00Z',
        isAnswered: true
      }
    ];

    setQuestions(mockQuestions);
    setLoading(false);
  }, []);

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || question.tags.includes(selectedTag);
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'answered' && question.isAnswered) ||
                         (filterBy === 'unanswered' && !question.isAnswered);
    
    return matchesSearch && matchesTag && matchesFilter;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'votes':
        return b.votes - a.votes;
      case 'answers':
        return b.answers - a.answers;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  const allTags = [...new Set(questions.flatMap(q => q.tags))];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600 mt-1">
            {questions.length} questions • {questions.filter(q => q.isAnswered).length} answered
          </p>
        </div>
        <Link
          to="/ask"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Ask Question
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tag Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Filter */}
          <div className="w-full md:w-32">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="answered">Answered</option>
              <option value="unanswered">Unanswered</option>
            </select>
          </div>

          {/* Sort */}
          <div className="w-full md:w-32">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="votes">Most Votes</option>
              <option value="answers">Most Answers</option>
              <option value="views">Most Views</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {sortedQuestions.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filter criteria.
            </p>
            <Link
              to="/ask"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Ask the first question
            </Link>
          </div>
        ) : (
          sortedQuestions.map((question) => (
            <div key={question.id} className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-start space-x-4">
                {/* Stats */}
                <div className="flex flex-col items-center space-y-2 text-sm text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{question.votes}</div>
                    <div>votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{question.answers}</div>
                    <div>answers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{question.views}</div>
                    <div>views</div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  <Link
                    to={`/questions/${question.id}`}
                    className="block hover:text-primary-600"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary-600">
                      {question.title}
                    </h2>
                  </Link>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {question.content}
                  </p>

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

                  {/* Meta */}
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
                    </div>
                    
                    {question.isAnswered && (
                      <div className="flex items-center text-green-600">
                        <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-1">
                          <span className="text-white text-xs">✓</span>
                        </span>
                        Answered
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Questions; 