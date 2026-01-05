// src/services/keycloak.js
import Keycloak from "keycloak-js";

const url = import.meta.env.VITE_KEYCLOAK_URL;
if (!url) {
  throw new Error("Missing VITE_KEYCLOAK_URL (must be set at build time)");
}

const keycloak = new Keycloak({
  url,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

export default keycloak;
