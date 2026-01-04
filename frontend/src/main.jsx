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
    onLoad: "check-sso",     // allow public pages like /signup
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

      </div>
    );
  });
