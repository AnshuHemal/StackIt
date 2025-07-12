import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Tag, 
  User, 
  Clock, 
  Eye, 
  MessageSquare, 
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Questions = () => {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;
  const [votedQuestions, setVotedQuestions] = useState(() => {
    // Load voted questions from localStorage on component mount
    const saved = localStorage.getItem('votedQuestions');
    return saved ? new Map(JSON.parse(saved)) : new Map();
  });

  useEffect(() => {
    // TODO: Fetch questions from API
    // For now, using mock data with 20 random questions
    const mockQuestions = [
      {
        id: 1,
        title: 'How to implement authentication in React with JWT?',
        content: 'I\'m building a React application and need to implement user authentication using JWT tokens. I\'ve been looking at various tutorials but I\'m not sure about the best practices for token storage, refresh tokens, and handling authentication state.',
        author: { username: 'reactdev', reputation: 1250 },
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
        content: 'I\'m working on a large React application and need advice on state management. We\'re currently using Context API but it\'s becoming hard to manage. Should we switch to Redux, Zustand, or stick with Context?',
        author: { username: 'senior_dev', reputation: 2100 },
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
        content: 'My React app is getting slow with large datasets. What are the best optimization techniques? I\'ve heard about React.memo, useMemo, and useCallback but I\'m not sure when to use each.',
        author: { username: 'perf_expert', reputation: 1800 },
        tags: ['react', 'performance', 'optimization'],
        votes: 12,
        answers: 5,
        views: 189,
        createdAt: '2024-01-13T09:15:00Z',
        isAnswered: true
      },
      {
        id: 4,
        title: 'Understanding TypeScript generics in React components',
        content: 'I\'m learning TypeScript and trying to understand how to use generics in React components. Can someone explain with practical examples how to create reusable typed components?',
        author: { username: 'ts_learner', reputation: 450 },
        tags: ['typescript', 'react', 'generics'],
        votes: 6,
        answers: 4,
        views: 98,
        createdAt: '2024-01-12T16:45:00Z',
        isAnswered: true
      },
      {
        id: 5,
        title: 'Setting up a Node.js backend with Express and MongoDB',
        content: 'I want to create a REST API using Node.js, Express, and MongoDB. What\'s the best way to structure the project and handle database connections?',
        author: { username: 'backend_newbie', reputation: 320 },
        tags: ['nodejs', 'express', 'mongodb', 'api'],
        votes: 9,
        answers: 7,
        views: 145,
        createdAt: '2024-01-11T11:20:00Z',
        isAnswered: true
      },
      {
        id: 6,
        title: 'CSS Grid vs Flexbox: When to use which?',
        content: 'I\'m confused about when to use CSS Grid vs Flexbox. Can someone explain the differences and provide examples of when each is more appropriate?',
        author: { username: 'css_master', reputation: 890 },
        tags: ['css', 'grid', 'flexbox', 'layout'],
        votes: 18,
        answers: 6,
        views: 267,
        createdAt: '2024-01-10T13:30:00Z',
        isAnswered: true
      },
      {
        id: 7,
        title: 'How to implement real-time features with Socket.io?',
        content: 'I need to add real-time chat functionality to my web app. How do I implement this using Socket.io with React and Node.js?',
        author: { username: 'realtime_dev', reputation: 670 },
        tags: ['socket.io', 'react', 'nodejs', 'real-time'],
        votes: 11,
        answers: 3,
        views: 178,
        createdAt: '2024-01-09T09:45:00Z',
        isAnswered: false
      },
      {
        id: 8,
        title: 'Docker containerization for React and Node.js apps',
        content: 'I want to containerize my full-stack application. What\'s the best approach for Dockerizing React frontend and Node.js backend?',
        author: { username: 'docker_expert', reputation: 1100 },
        tags: ['docker', 'react', 'nodejs', 'containerization'],
        votes: 14,
        answers: 8,
        views: 203,
        createdAt: '2024-01-08T15:10:00Z',
        isAnswered: true
      },
      {
        id: 9,
        title: 'Testing React components with Jest and React Testing Library',
        content: 'I\'m new to testing in React. How do I write effective tests using Jest and React Testing Library? What should I test and what should I avoid?',
        author: { username: 'test_driven', reputation: 750 },
        tags: ['react', 'testing', 'jest', 'rtl'],
        votes: 7,
        answers: 5,
        views: 134,
        createdAt: '2024-01-07T12:25:00Z',
        isAnswered: true
      },
      {
        id: 10,
        title: 'Git workflow for team collaboration',
        content: 'My team is struggling with Git workflow. What\'s the best branching strategy for a team of 5 developers? Should we use Git Flow, GitHub Flow, or something else?',
        author: { username: 'git_guru', reputation: 950 },
        tags: ['git', 'workflow', 'collaboration', 'branching'],
        votes: 13,
        answers: 9,
        views: 189,
        createdAt: '2024-01-06T10:15:00Z',
        isAnswered: true
      },
      {
        id: 11,
        title: 'Building responsive design with Tailwind CSS',
        content: 'I\'m using Tailwind CSS for the first time. How do I create responsive designs effectively? What are the best practices for mobile-first design?',
        author: { username: 'tailwind_user', reputation: 420 },
        tags: ['tailwind', 'css', 'responsive', 'design'],
        votes: 5,
        answers: 4,
        views: 87,
        createdAt: '2024-01-05T14:40:00Z',
        isAnswered: false
      },
      {
        id: 12,
        title: 'API rate limiting and security best practices',
        content: 'I\'m building a public API and need to implement rate limiting and security measures. What are the essential security practices I should implement?',
        author: { username: 'security_dev', reputation: 1300 },
        tags: ['api', 'security', 'rate-limiting', 'best-practices'],
        votes: 16,
        answers: 6,
        views: 245,
        createdAt: '2024-01-04T08:55:00Z',
        isAnswered: true
      },
      {
        id: 13,
        title: 'Deploying React apps to production',
        content: 'I\'m ready to deploy my React app to production. What\'s the best hosting platform? Should I use Vercel, Netlify, or AWS?',
        author: { username: 'deploy_master', reputation: 680 },
        tags: ['react', 'deployment', 'hosting', 'production'],
        votes: 10,
        answers: 7,
        views: 167,
        createdAt: '2024-01-03T16:20:00Z',
        isAnswered: true
      },
      {
        id: 14,
        title: 'Understanding async/await in JavaScript',
        content: 'I\'m learning async/await in JavaScript but I\'m still confused about when to use it vs Promises. Can someone explain with practical examples?',
        author: { username: 'js_learner', reputation: 380 },
        tags: ['javascript', 'async', 'await', 'promises'],
        votes: 8,
        answers: 5,
        views: 123,
        createdAt: '2024-01-02T11:30:00Z',
        isAnswered: true
      },
      {
        id: 15,
        title: 'Database design for e-commerce applications',
        content: 'I\'m designing a database for an e-commerce application. What\'s the best way to structure tables for products, orders, and users?',
        author: { username: 'db_architect', reputation: 1400 },
        tags: ['database', 'e-commerce', 'design', 'sql'],
        votes: 19,
        answers: 11,
        views: 298,
        createdAt: '2024-01-01T13:45:00Z',
        isAnswered: true
      },
      {
        id: 16,
        title: 'Building accessible React components',
        content: 'I want to make my React components more accessible. What are the key accessibility features I should implement?',
        author: { username: 'a11y_advocate', reputation: 720 },
        tags: ['react', 'accessibility', 'a11y', 'components'],
        votes: 6,
        answers: 4,
        views: 89,
        createdAt: '2023-12-31T09:10:00Z',
        isAnswered: false
      },
      {
        id: 17,
        title: 'Microservices architecture with Node.js',
        content: 'I\'m planning to break down my monolithic Node.js app into microservices. What are the best practices and common pitfalls to avoid?',
        author: { username: 'microservice_dev', reputation: 1600 },
        tags: ['nodejs', 'microservices', 'architecture', 'best-practices'],
        votes: 22,
        answers: 8,
        views: 312,
        createdAt: '2023-12-30T15:25:00Z',
        isAnswered: true
      },
      {
        id: 18,
        title: 'GraphQL vs REST API design',
        content: 'I\'m starting a new project and can\'t decide between GraphQL and REST. What are the pros and cons of each approach?',
        author: { username: 'api_designer', reputation: 980 },
        tags: ['graphql', 'rest', 'api', 'design'],
        votes: 17,
        answers: 10,
        views: 234,
        createdAt: '2023-12-29T12:40:00Z',
        isAnswered: true
      },
      {
        id: 19,
        title: 'Implementing dark mode in React applications',
        content: 'I want to add dark mode to my React app. What\'s the best way to implement theme switching with CSS variables and React context?',
        author: { username: 'theme_dev', reputation: 550 },
        tags: ['react', 'dark-mode', 'theming', 'css'],
        votes: 9,
        answers: 6,
        views: 145,
        createdAt: '2023-12-28T10:15:00Z',
        isAnswered: true
      },
      {
        id: 20,
        title: 'CI/CD pipeline setup with GitHub Actions',
        content: 'I want to set up automated testing and deployment using GitHub Actions. How do I create a workflow for my React/Node.js project?',
        author: { username: 'devops_engineer', reputation: 1200 },
        tags: ['ci-cd', 'github-actions', 'automation', 'deployment'],
        votes: 14,
        answers: 7,
        views: 198,
        createdAt: '2023-12-27T14:50:00Z',
        isAnswered: true
      }
    ];

    // Load user-created questions from localStorage
    const userQuestions = JSON.parse(localStorage.getItem('userQuestions') || '[]');
    
    // Load vote counts from localStorage
    const savedVoteCounts = JSON.parse(localStorage.getItem('questionVoteCounts') || '{}');
    
    // Merge mock questions with user questions and apply vote counts
    const mergedQuestions = [...userQuestions, ...mockQuestions].map(q => ({
      ...q,
      votes: savedVoteCounts[q.id] !== undefined ? savedVoteCounts[q.id] : q.votes
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

    setQuestions(mergedQuestions);
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

  // Pagination logic
  const totalPages = Math.ceil(sortedQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = sortedQuestions.slice(startIndex, endIndex);

  const allTags = [...new Set(questions.flatMap(q => q.tags))];

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTag, sortBy, filterBy]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVote = (type, questionId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }

    // Check if user has already voted on this question
    if (votedQuestions.has(questionId)) {
      toast.error('You have already voted on this question');
      return;
    }

    // Update the vote count in the questions state
    setQuestions(prevQuestions => {
      const updated = prevQuestions.map(question => {
        if (question.id === questionId) {
          const voteChange = type === 'up' ? 1 : -1;
          return {
            ...question,
            votes: question.votes + voteChange
          };
        }
        return question;
      });
      // Save updated vote counts to localStorage
      const voteCounts = {};
      updated.forEach(q => { voteCounts[q.id] = q.votes; });
      localStorage.setItem('questionVoteCounts', JSON.stringify(voteCounts));
      
      // Also update the user questions in localStorage with new vote counts
      const userQuestions = JSON.parse(localStorage.getItem('userQuestions') || '[]');
      const updatedUserQuestions = userQuestions.map(q => ({
        ...q,
        votes: voteCounts[q.id] !== undefined ? voteCounts[q.id] : q.votes
      }));
      localStorage.setItem('userQuestions', JSON.stringify(updatedUserQuestions));
      return updated;
    });

    // Mark this question as voted with the vote type
    const newVotedQuestions = new Map(votedQuestions);
    newVotedQuestions.set(questionId, type);
    setVotedQuestions(newVotedQuestions);
    // Save to localStorage
    localStorage.setItem('votedQuestions', JSON.stringify(Array.from(newVotedQuestions.entries())));

    toast.success(`${type === 'up' ? 'Upvoted' : 'Downvoted'} successfully`);
  };

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
            {sortedQuestions.length} questions • {sortedQuestions.filter(q => q.isAnswered).length} answered
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
        {currentQuestions.length === 0 ? (
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
          currentQuestions.map((question) => (
            <div key={question.id} className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-start space-x-4">
                {/* Stats */}
                <div className="flex flex-col items-center space-y-2 text-sm text-gray-500">
                  <button
                    onClick={() => handleVote('up', question.id)}
                    className={`p-2 rounded transition-colors ${
                      votedQuestions.get(question.id) === 'up'
                        ? 'bg-green-100 text-green-600 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-400 hover:text-green-600'
                    }`}
                    title="Upvote"
                    disabled={!!votedQuestions.get(question.id)}
                  >
                    <ThumbsUp className="h-5 w-5" />
                  </button>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{question.votes}</div>
                    <div>votes</div>
                  </div>
                  <button
                    onClick={() => handleVote('down', question.id)}
                    className={`p-2 rounded transition-colors ${
                      votedQuestions.get(question.id) === 'down'
                        ? 'bg-red-100 text-red-600 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'
                    }`}
                    title="Downvote"
                    disabled={!!votedQuestions.get(question.id)}
                  >
                    <ThumbsDown className="h-5 w-5" />
                  </button>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white shadow-sm rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedQuestions.length)} of {sortedQuestions.length} questions
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            page === currentPage
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questions; 