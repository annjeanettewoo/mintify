// src/App.jsx
import { useState } from "react";
import "./App.css";
import logo from "./assets/mintify-logo.png";

/* ---------- LOGIN PAGE ---------- */
function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess(); // go to dashboard for now
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <img src={logo} alt="Mintify logo" />
          <span className="brand-name">mintify</span>
        </div>

        <h1 className="auth-title">Welcome back 👋</h1>
        <p className="auth-subtitle">
          Log in to see your spendings, budgets and insights.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              onClick={() => alert("Forgot password flow coming soon ✨")}
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
            onClick={() => alert("Sign-up page coming soon ✨")}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

/* ---------- DASHBOARD (your existing page) ---------- */
function Dashboard({ onLogout }) {
  // paste your existing dashboard JSX here EXACTLY as you have it now,
  // but wrap it in a single <div> and use onLogout on the Log out button.
  return (
    <div className="app">
      {/* ... your existing dashboard code ... */}
    </div>
  );
}

/* ---------- ROOT APP: switch between login and dashboard ---------- */
function App() {
  const [page, setPage] = useState("login"); // "login" | "dashboard"

  if (page === "login") {
    return <Login onSuccess={() => setPage("dashboard")} />;
  }

  return <Dashboard onLogout={() => setPage("login")} />;
}

export default App;
