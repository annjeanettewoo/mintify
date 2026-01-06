// frontend/src/App.jsx

import "./App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import Spendings from "./pages/Spendings.jsx";
import Budgets from "./pages/Budgets.jsx";
import CalendarPage from "./pages/Calendar/CalendarPage.jsx";
import Signup from "./pages/Signup.jsx";
import SpendingReport from "./pages/spendingReport.jsx";

import keycloak from "./services/keycloak";

// Wrapper to protect authenticated routes
function RequireAuth({ children }) {
  const location = useLocation();

  if (!keycloak.authenticated) {
    return (
      <Navigate
        to="/signup"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default function App() {
  const tokenParsed = keycloak?.tokenParsed || {};
  const userName =
    tokenParsed.preferred_username ||
    tokenParsed.name ||
    tokenParsed.given_name ||
    "User";

  // Always redirect back to deployed frontend origin
  const redirectUri = window.location.origin;

  const handleLogin = () => keycloak.login({ redirectUri });
  const handleRegister = () => keycloak.register({ redirectUri });
  const handleLogout = () => keycloak.logout({ redirectUri });

  return (
    <Routes>
      {/* Public route */}
      <Route
        path="/signup"
        element={
          <Signup
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        }
      />

      {/* Home */}
      <Route
        path="/"
        element={
          keycloak.authenticated ? (
            <Dashboard onLogout={handleLogout} userName={userName} />
          ) : (
            <Navigate to="/signup" replace />
          )
        }
      />

      {/* Protected routes */}
      <Route
        path="/spendings"
        element={
          <RequireAuth>
            <Spendings />
          </RequireAuth>
        }
      />

      <Route
        path="/budgets"
        element={
          <RequireAuth>
            <Budgets />
          </RequireAuth>
        }
      />

      <Route
        path="/calendar"
        element={
          <RequireAuth>
            <CalendarPage />
          </RequireAuth>
        }
      />

      <Route
        path="/report/spending"
        element={
          <RequireAuth>
            <SpendingReport />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
