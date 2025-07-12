import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Tag, HelpCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AskQuestion = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please log in to ask a question');
      navigate('/login');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    if (formData.title.length < 10) {
      toast.error('Title must be at least 10 characters long');
      return;
    }

    if (formData.content.length < 20) {
      toast.error('Content must be at least 20 characters long');
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Implement API call to create question
      const questionData = {
        title: formData.title,
        content: formData.content,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        category: formData.category
      };
      
      console.log('Question data:', questionData);
      toast.success('Question posted successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to post question');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-sm text-gray-500">
            You need to be logged in to ask a question.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Sign in to continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ask a Question</h1>
          <p className="text-gray-600">
            Share your knowledge and get help from the community. Be specific and provide context.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Question Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="What's your question? Be specific."
              maxLength={200}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="programming">Programming</option>
              <option value="technology">Technology</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Question Details *
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              value={formData.content}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Provide detailed information about your question. Include relevant context, code examples, or specific scenarios."
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.content.length} characters
            </p>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="javascript, react, web-development (comma separated)"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Add relevant tags to help others find your question
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Tips for a good question</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Be specific and provide context</li>
                    <li>Include relevant code examples if applicable</li>
                    <li>Explain what you've already tried</li>
                    <li>Use clear and descriptive language</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskQuestion; 