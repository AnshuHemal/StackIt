import React from "react";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import { useEffect } from "react";
import { RefreshHandler } from "./RefreshHandler";
import ProtectedRoute from "./ProtectedRoute";
import Overview from "./components/DashboardComponents/Overview";
import AskQuestions from "./components/DashboardComponents/AskQuestions";
import QuestionDetails from "./components/DashboardComponents/QuestionDetails";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_AUTH_URL}/verify`,
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);
  return (
    <div>
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Dashboard />
              </ProtectedRoute>
            ) : (
              <Dashboard />
            )
          }
        >
          <Route path="" element={<Overview />} />
          <Route path="/questions/ask" element={<AskQuestions />} />
          <Route path="/questions/:slug" element={<QuestionDetails />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
