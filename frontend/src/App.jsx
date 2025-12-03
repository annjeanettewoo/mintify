// src/App.jsx
import { useState } from "react";
import "./App.css";
import logo from "./assets/mintify-logo.png";
import Dashboard from "./pages/Dashboard.jsx";
import { getPublicMessage } from "./services/authApi";

/* ---------- LOGIN PAGE ---------- */
function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    // simple “ping” to auth-service to prove backend connection
    const data = await getPublicMessage();
    console.log("Auth-service response:", data);

    // you can add simple check here if needed
    onSuccess(); // go to dashboard
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
                onClick={() =>
                  alert("Sign-up page coming soon ✨")
                }
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

/* ---------- ROOT APP: switch between login and dashboard ---------- */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <Login onSuccess={() => setIsLoggedIn(true)} />;
  }

  return <Dashboard onLogout={() => setIsLoggedIn(false)} />;
}

export default App;
