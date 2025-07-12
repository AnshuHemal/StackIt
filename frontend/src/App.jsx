import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Components
import Layout from './components/Layout/Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register.jsx';
import ForgotPassword from './pages/Auth/ForgotPassword.jsx';
import QuestionDetail from './pages/Questions/QuestionDetail.jsx';
import AskQuestion from './pages/Questions/AskQuestion.jsx';
import Questions from './pages/Questions/Questions.jsx';
import Profile from './pages/Profile/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

// Context
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';

// Styles
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <div className="App">
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/questions" element={<Questions />} />
                    <Route path="/questions/:id" element={<QuestionDetail />} />
                    <Route path="/ask" element={<AskQuestion />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
              </div>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App; 