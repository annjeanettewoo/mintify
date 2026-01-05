// src/pages/Signup.jsx
import "./Signup.css";
import heroImg from "../assets/signup.jpg";

function Signup({ onLogin, onRegister }) {
  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-left">
          <div className="signup-logo">Mintify</div>

          <div className="signup-heading">
            <h1>Welcome</h1>
          </div>

          <p style={{ marginTop: 8, opacity: 0.8 }}>
            Create your account or sign in to continue.
          </p>

          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 16 }}
            onClick={onRegister}
          >
            Create Account
          </button>

          <button
            type="button"
            className="btn-secondary signin-btn"
            style={{ marginTop: 10 }}
            onClick={onLogin}
          >
            Sign in
          </button>

          <div className="signup-footer">
            <span>Help@mintify.app</span>
          </div>
        </div>

        <div className="signup-right">
          <div className="signup-hero-tag">Free for personal use</div>

          <div className="signup-hero-image-wrapper">
            <img src={heroImg} alt="Working on laptop" />
          </div>

          <div className="signup-hero-text">
            <h2>
              The simplest way to manage your finances so you dont feel like youre drowning
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
