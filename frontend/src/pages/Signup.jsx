// src/pages/Signup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import heroImg from "../assets/signup.jpg";
import { signupUser } from "../services/authApi";

function Signup() {
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UX state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signupUser({ name, email, password });
      alert("Account created! You can now log in.");
      navigate("/"); // go back to login page
    } catch (err) {
      console.error(err);
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignIn = () => {
    navigate("/"); // just go back to login
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        {/* Left side – form */}
        <div className="signup-left">
          <div className="signup-logo">Mintify</div>

          <div className="signup-heading">
            <h1>Create an account</h1>
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <label className="signup-label">
              Name
              <input
                type="text"
                placeholder="Eg. Annjeanette Woo"
                className="signup-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="signup-label">
              Email
              <input
                type="email"
                placeholder="you@email.com"
                className="signup-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="signup-label">
              Password
              <input
                type="password"
                placeholder="••••••••"
                className="signup-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && (
              <p
                style={{
                  color: "#b23a37",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleGoToSignIn}
            >
              Sign in
            </button>
          </form>

          <div className="signup-footer">
            <span>Help@mintify.app</span>
          </div>
        </div>

        {/* Right side – hero */}
        <div className="signup-right">
          <div className="signup-hero-tag">Free for personal use</div>

          <div className="signup-hero-image-wrapper">
            <img src={heroImg} alt="Working on laptop" />
          </div>

          <div className="signup-hero-text">
            <h2>The simplest way to manage your finances so you dont feel like you are drowning</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
