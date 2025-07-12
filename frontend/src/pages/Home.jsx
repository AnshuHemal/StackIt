import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { MessageSquare, Users, Tag, TrendingUp } from "lucide-react";

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to StackIt
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A minimal Q&A forum platform for collaborative learning and knowledge
          sharing. Ask questions, share answers, and grow together with the
          community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isAuthenticated ? (
            <>
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                to="/questions"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Browse Questions
              </Link>
            </>
          ) : (
            <Link
              to="/ask"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              Ask a Question
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <MessageSquare className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ask Questions
          </h3>
          <p className="text-gray-600">
            Get help from the community by asking well-formatted questions with
            rich text support.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <Users className="w-6 h-6 text-success-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Share Knowledge
          </h3>
          <p className="text-gray-600">
            Help others by providing detailed answers and earn reputation
            points.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <Tag className="w-6 h-6 text-warning-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Organized Tags
          </h3>
          <p className="text-gray-600">
            Find relevant content easily with our comprehensive tagging system.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="w-12 h-12 bg-error-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
            <TrendingUp className="w-6 h-6 text-error-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Real-time Updates
          </h3>
          <p className="text-gray-600">
            Stay connected with instant notifications and live updates.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Community Stats
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              1,234
            </div>
            <div className="text-gray-600">Questions Asked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600 mb-2">
              5,678
            </div>
            <div className="text-gray-600">Answers Provided</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600 mb-2">890</div>
            <div className="text-gray-600">Active Users</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 rounded-lg p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
          Join thousands of developers, students, and professionals who are
          already learning and sharing knowledge on StackIt.
        </p>
        {!isAuthenticated ? (
          <Link
            to="/register"
            className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 transition-colors"
          >
            Join the Community
          </Link>
        ) : (
          <Link
            to="/ask"
            className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-primary-700 transition-colors"
          >
            Ask Your First Question
          </Link>
        )}
      </div>
    </div>
  );
};

export default Home;
