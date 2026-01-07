// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import keycloak from "./services/keycloak";
window.keycloak = keycloak;

const root = ReactDOM.createRoot(document.getElementById("root"));

function renderLoading(message = "Loading…") {
  root.render(
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      {message}
    </div>
  );
}

function renderError(title, details) {
  root.render(
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h3 style={{ margin: "0 0 8px" }}>{title}</h3>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {details || "No details available."}
      </pre>
      <p style={{ marginTop: 12 }}>
        Check DevTools → Console + Network for the failing request.
      </p>
    </div>
  );
}

renderLoading("Initializing authentication…");

// Safety timeout so the UI doesn’t look “stuck forever”
const INIT_TIMEOUT_MS = 15000;
const timeoutId = setTimeout(() => {
  renderError(
    "Keycloak init is taking too long",
    "Possible causes:\n- Keycloak URL/realm/client misconfigured\n- Network/DNS/TLS issue\n- Browser blocked cookies/redirects\n\nOpen DevTools → Network and look for requests to /realms/<realm>."
  );
}, INIT_TIMEOUT_MS);

keycloak
  .init({
    onLoad: "check-sso", // app loads even if not logged in
    pkceMethod: "S256",
    checkLoginIframe: false,
  })
  .then(() => {
    clearTimeout(timeoutId);

    // NOTE: Keep StrictMode OFF while debugging auth loops
    root.render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  })
  .catch((err) => {
    clearTimeout(timeoutId);

    console.error("Keycloak init failed", err);
    renderError(
      "Keycloak init failed",
      String(err?.message || err || "Unknown error")
    );
  });
