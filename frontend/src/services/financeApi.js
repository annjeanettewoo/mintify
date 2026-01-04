// frontend/src/services/financeApi.js

// All app APIs (budgets + transactions) now go via the gateway-service
// In dev:  http://localhost:4000
// In prod: https://gateway.ltu-m7011e-9.se  (see .env files)
// frontend/src/services/financeApi.js
import keycloak from "./keycloak";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function safeJson(res, fallback) {
  if (!res) return fallback;

  // If not authorized, return fallback (so UI doesn't crash)
  if (res.status === 401 || res.status === 403) return fallback;

  try {
    const text = await res.text();
    if (!text) return fallback;
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function authFetch(path, init = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers || {});

  // Only attach token when logged in
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      // token refresh failed; proceed without token (will 401)
    }

    if (keycloak.token) {
      headers.set("Authorization", `Bearer ${keycloak.token}`);
    }
  }

  return fetch(url, { ...init, headers });
}

// ===== API functions =====

export async function fetchSummary() {
  const res = await authFetch("/api/summary", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, {});
}

export async function fetchAdvice() {
  const res = await authFetch("/api/advice", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, {});
}

export async function fetchNotifications() {
  const res = await authFetch("/api/notifications", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, []);
}

export async function fetchBudgets() {
  const res = await authFetch("/api/budgets", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, []);
}

export async function fetchTransactions() {
  const res = await authFetch("/api/transactions", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, []);
}

