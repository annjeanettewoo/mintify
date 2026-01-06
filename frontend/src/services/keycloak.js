// src/services/keycloak.js
import Keycloak from "keycloak-js";

const url = "https://keycloak.ltu-m7011e-9.se";
if (!url) {
  throw new Error("Missing VITE_KEYCLOAK_URL (must be set at build time)");
}

const keycloak = new Keycloak({
  url,
  realm: mintify,
  clientId: mintify-frontend,
});

export default keycloak;
