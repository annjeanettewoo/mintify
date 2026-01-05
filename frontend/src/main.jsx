// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import keycloak from "./services/keycloak";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<div style={{ padding: 16 }}>Loading…</div>);

keycloak
  .init({
    onLoad: "check-sso",     // allow app to load even if not logged in
    pkceMethod: "S256",
    checkLoginIframe: false,
  })
  .then(() => {
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  })
  .catch((err) => {
    console.error("Keycloak init failed", err);
    root.render(
      <div style={{ padding: 16 }}>
        Keycloak init failed. Check console + Keycloak settings.
      </div>
    );
  });
