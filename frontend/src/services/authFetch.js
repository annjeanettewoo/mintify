// src/services/authFetch.js
import keycloak from "./keycloak";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://gateway.ltu-m7011e-9.se";

export async function authFetch(path, options = {}) {
  if (!keycloak) throw new Error("KEYCLOAK_NOT_INITIALIZED");
  if (!keycloak.authenticated) throw new Error("AUTH_NOT_READY");

  const headers = { ...(options.headers || {}) };

  await keycloak.updateToken(30);

  if (keycloak.token) {
    headers.Authorization = `Bearer ${keycloak.token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  return res;
}
