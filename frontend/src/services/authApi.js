// frontend/src/services/authApi.js
import keycloak from "./keycloak";

export function login() {
  return keycloak.login({ redirectUri: window.location.origin });
}

export function register() {
  return keycloak.register({ redirectUri: window.location.origin });
}

export function logout() {
  return keycloak.logout({ redirectUri: window.location.origin });
}

export function isAuthenticated() {
  return !!keycloak.authenticated;
}

export function getUserProfile() {
  const token = keycloak?.tokenParsed || {};
  return {
    id: token.sub,
    username: token.preferred_username,
    name: token.name,
    email: token.email,
  };
}
