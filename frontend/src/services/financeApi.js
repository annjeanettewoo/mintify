// src/services/financeApi.js
import keycloak from "./keycloak";

// All app APIs go via the gateway-service
// base URL comes from .env: VITE_API_BASE_URL=http://localhost:4000
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://gateway.ltu-m7011e-9.se";

async function authFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (keycloak?.authenticated) {
    try {
      // Refresh token if it expires in the next 30s
      await keycloak.updateToken(30);
    } catch (e) {
      // If refresh fails, request may 401; we'll handle below
    }

    if (keycloak.token) {
      headers.Authorization = `Bearer ${keycloak.token}`;
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // If unauthorized, kick user back to Keycloak login
  if (res.status === 401) {
    try {
      await keycloak.login();
    } catch (e) {
      // ignore
    }
    throw new Error("Unauthorized (401) - redirecting to login");
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
