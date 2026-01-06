// src/services/financeApi.js
import keycloak from "./keycloak";

// All app APIs go via the gateway-service
// base URL comes from .env: VITE_API_BASE_URL=http://localhost:4000
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

let loginTriggered = false;

async function getFreshToken(minValiditySec = 60) {
  if (!keycloak?.authenticated) return null;

  // If token is close to expiring, refresh it
  await keycloak.updateToken(minValiditySec);
  return keycloak.token || null;
}

async function authFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  // 1) Always try to refresh BEFORE request (don’t ignore failures)
  try {
    const token = await getFreshToken(60);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // Refresh failed -> force re-login ONCE (avoid infinite loop)
    if (!loginTriggered) {
      loginTriggered = true;
      await keycloak.login();
    }
    throw new Error("Session expired - re-login required");
  }

  // 2) Make request
  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 3) If 401, refresh token once and retry once
  if (res.status === 401 && keycloak?.authenticated) {
    try {
      await keycloak.updateToken(0); // force refresh now
      if (keycloak.token) {
        headers.Authorization = `Bearer ${keycloak.token}`;
        res = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
        });
      }
    } catch (e) {
      // ignore, handled below
    }
  }

  // 4) Still 401 -> login once (no loops)
  if (res.status === 401) {
    if (!loginTriggered) {
      loginTriggered = true;
      await keycloak.login();
    }
    throw new Error("Unauthorized (401) - re-login required");
  }

  return res;
}

async function safeJson(res, defaultValue) {
  if (res.ok) return res.json();
  if (res.status === 304) return defaultValue;

  const text = await res.text().catch(() => "");
  throw new Error(text || `Request failed (${res.status})`);
}

// ---------- BUDGETS (via gateway → budget-service) ----------

export async function fetchBudgets() {
  const res = await authFetch("/api/budgets", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, []);
}

export async function createBudget({ category, limit }) {
  const res = await authFetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, limit: Number(limit) }),
  });
  return safeJson(res);
}

export async function updateBudget(id, { category, limit }) {
  const res = await authFetch(`/api/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, limit: Number(limit) }),
  });
  return safeJson(res);
}

export async function deleteBudget(id) {
  const res = await authFetch(`/api/budgets/${id}`, {
    method: "DELETE",
  });

  // many DELETEs return 204 No Content
  if (res.status === 204) return;
  return safeJson(res);
}

export async function patchBudgetSpent(id, amount) {
  const res = await authFetch(`/api/budgets/${id}/spent`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Number(amount) }),
  });
  return safeJson(res);
}

// ---------- TRANSACTIONS (via gateway → transact-service) ----------

export async function fetchTransactions() {
  const res = await authFetch("/api/transactions", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, []);
}

export async function createTransaction(payload) {
  const res = await authFetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      amount: Number(payload.amount),
    }),
  });
  return safeJson(res);
}

export async function updateTransaction(id, payload) {
  const res = await authFetch(`/api/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      amount: Number(payload.amount),
    }),
  });
  return safeJson(res);
}

export async function deleteTransaction(id) {
  const res = await authFetch(`/api/transactions/${id}`, {
    method: "DELETE",
  });

  if (res.status === 204) return;
  return safeJson(res);
}

export async function fetchSpendingEvents() {
  const res = await authFetch("/api/transactions/events/spending", {
    method: "GET",
    headers: { "Cache-Control": "no-cache" },
    cache: "no-store",
  });
  return safeJson(res, []);
}
