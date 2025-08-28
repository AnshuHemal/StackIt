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
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        
        // Check if data has the expected structure
        if (!data.data || !Array.isArray(data.data.questions)) {
          console.error('Unexpected data structure:', data);
          toast.error('Failed to load questions - invalid data format');
          return;
        }
        
        // Transform backend data to match frontend structure
        const transformedQuestions = data.data.questions.map(q => ({
          id: q._id,
          title: q.title,
          content: q.description,
          author: {
            username: q.author.username,
            reputation: q.author.reputation || 0
          },
          tags: q.tags,
          votes: q.voteCount || 0,
          answers: q.answerCount || 0,
          views: q.views || 0,
          createdAt: q.createdAt,
          isAnswered: q.answerCount > 0
        }));
        
        setQuestions(transformedQuestions);
      } else {
        console.error('Failed to fetch questions');
        toast.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

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

  const handleVote = async (type, questionId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to vote');
      return;
    }

    // Check if user has already voted on this question
    if (votedQuestions.has(questionId)) {
      toast.error('You have already voted on this question');
      return;
    }

    try {
      const response = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          voteType: type === 'up' ? 'upvote' : 'downvote'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the vote count in the questions state
        setQuestions(prevQuestions => {
          return prevQuestions.map(question => {
            if (question.id === questionId) {
              return {
                ...question,
                votes: data.voteCount
              };
            }
            return question;
          });
        });

        // Mark this question as voted with the vote type
        const newVotedQuestions = new Map(votedQuestions);
        newVotedQuestions.set(questionId, type);
        setVotedQuestions(newVotedQuestions);
        // Save to localStorage
        localStorage.setItem('votedQuestions', JSON.stringify(Array.from(newVotedQuestions.entries())));

        toast.success(`${type === 'up' ? 'Upvoted' : 'Downvoted'} successfully`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting on question:', error);
      toast.error('Failed to vote on question');
    }
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