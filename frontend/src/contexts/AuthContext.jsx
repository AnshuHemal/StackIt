import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext(undefined);

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await axios.get('/api/auth/me');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.data.data.user, token },
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_FAIL' });
        }
      } else {
        dispatch({ type: 'AUTH_FAIL' });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (identifier, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await axios.post('/api/auth/login', {
        identifier,
        password,
      });
      
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL' });
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });
      
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token },
      });
    } catch (error) {
      dispatch({ type: 'AUTH_FAIL' });
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 