// frontend/src/App.jsx
// trigger CD pt2

import "./App.css";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import Spendings from "./pages/Spendings.jsx";
import Budgets from "./pages/Budgets.jsx";
import CalendarPage from "./pages/Calendar/CalendarPage.jsx";
import Signup from "./pages/Signup.jsx";

// ✅ add this import
import SpendingReport from "./pages/spendingReport.jsx";

import keycloak from "./services/keycloak";

// Small wrapper to protect routes
function RequireAuth({ children }) {
  const location = useLocation();

  if (!keycloak.authenticated) {
    // send them to signup (which can also offer "Log in")
    return <Navigate to="/signup" replace state={{ from: location.pathname }} />;
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

  // Always come back to the deployed frontend origin (e.g. https://mintify.ltu-m7011e-9.se)
  const redirectUri = window.location.origin;

  const handleLogout = () => keycloak.logout({ redirectUri });

  const handleLogin = () => keycloak.login({ redirectUri });

  const handleRegister = () => keycloak.register({ redirectUri });

  return (
    <Routes>
      {/* Public signup route */}
      <Route
        path="/signup"
        element={<Signup onLogin={handleLogin} onRegister={handleRegister} />}
      />

      {/* Default route */}
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

      {/* ✅ NEW protected report route */}
      <Route
        path="/report/spending"
        element={
          <RequireAuth>
            <SpendingReport />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
