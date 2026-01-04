import React from "react";
import "./Signup.css";

export default function Signup({ onLogin, onRegister }) {
  return (
    <div className="signup-container">
      <div className="signup-box">
        <h1 className="signup-title">Mintify</h1>
        <p className="signup-subtitle">
          Create an account or log in to continue.
        </p>

        <div className="signup-actions">
          <button
            className="signup-button primary"
            onClick={() => onRegister && onRegister()}
          >
            Create account
          </button>

          <button
            className="signup-button secondary"
            onClick={() => onLogin && onLogin()}
          >
            Log in
          </button>
        </div>

        <p className="signup-footnote">
          You’ll be redirected to Keycloak to complete registration/login.
        </p>
      </div>
    </div>
  );
}
