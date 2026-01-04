import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import keycloak from "./services/keycloak";

const rootEl = document.getElementById("root");
const root = ReactDOM.createRoot(rootEl);

// Show loading page immediately
root.render(<div style={{ padding: 16 }}>Loading…</div>);

keycloak
  .init({
    onLoad: "login-required", // force Keycloak login before app loads
    pkceMethod: "S256",
    checkLoginIframe: false,
  })
  .then((authenticated) => {
    if (!authenticated) {
      return keycloak.login();
    }

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
