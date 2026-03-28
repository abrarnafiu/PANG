import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AnalysisPage from "./pages/AnalysisPage";
import MonteCarloPage from "./pages/MonteCarloPage";
import NotFoundPage from "./pages/NotFoundPage";
import "./index.css";

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/:ticker"
            element={
              <ProtectedRoute>
                <AnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/montecarlo/:ticker"
            element={
              <ProtectedRoute>
                <MonteCarloPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/montecarlo"
            element={
              <ProtectedRoute>
                <MonteCarloPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
