// src/App.jsx
import { useState } from "react";
import "./App.css";
import logo from "./assets/mintify-logo.png";

import Dashboard from "./pages/Dashboard.jsx";
import Spendings from "./pages/Spendings.jsx";
import Signup from "./pages/Signup.jsx";
import Budgets from "./pages/Budgets.jsx";

import { getPublicMessage } from "./services/authApi";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

/* ---------- LOGIN PAGE ---------- */
function Login({ onSuccess }) {
  const [name, setName] = useState("");        // 💡 NEW
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await getPublicMessage();
      console.log("Auth-service response:", data);

      // Send the name back up to App
      onSuccess(name || "Guest");
    } catch (err) {
      console.error(err);
      alert("Login failed: cannot reach auth-service");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-shell">
        {/* LEFT SIDE — logo only */}
        <div className="auth-left logo-only">
          <img src={logo} alt="Mintify logo" className="auth-big-logo" />
        </div>

        {/* RIGHT SIDE — login form */}
        <div className="auth-right">
          <div className="auth-card">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">
              Log in to see your spendings, budgets and insights.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {/* 👇 NEW name field */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  className="auth-input"
                  type="text"
                  placeholder="Annj"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="auth-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="auth-actions">
                <label className="auth-remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() =>
                    alert("Forgot password flow coming soon ✨")
                  }
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-submit">
                Log in
              </button>
            </form>

            <p className="auth-footer">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- ROOT APP: routes + login state ---------- */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest");  // 💡 NEW

  return (
    <Routes>
      {/* Root: show login or dashboard depending on state */}
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Dashboard
              onLogout={() => setIsLoggedIn(false)}
              userName={userName}                      // 👈 pass name down
            />
          ) : (
            <Login
              onSuccess={(nameFromLogin) => {
                setUserName(nameFromLogin || "Guest");  // store name
                setIsLoggedIn(true);
              }}
            />
          )
        }
      />

      {/* Signup page */}
      <Route path="/signup" element={<Signup />} />

      {/* Spendings only when logged in */}
      <Route
        path="/spendings"
        element={
          isLoggedIn ? <Spendings /> : <Navigate to="/" replace />
        }
      />
      <Route
        path="/budgets"
        element={
          isLoggedIn ? <Budgets /> : <Navigate to="/" replace />
        }
      />

      {/* Fallback: anything else -> home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
