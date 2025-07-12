import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
    <p className="text-gray-600 mb-6">Sorry, the page you are looking for does not exist.</p>
    <Link
      to="/"
      className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md shadow hover:bg-primary-700 transition-colors"
    >
      Go Home
    </Link>
  </div>
);

export default NotFound; 