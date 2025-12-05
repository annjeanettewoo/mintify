// frontend/src/services/financeApi.js

// All app APIs (budgets + transactions) now go via the gateway-service
// In dev:  http://localhost:4000
// In prod: https://gateway.ltu-m7011e-9.se  (see .env files)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

console.log("API_BASE_URL (gateway) in frontend:", API_BASE_URL);

// Helper to handle 200 + 304 safely
async function safeJson(res, defaultValue) {
  // Treat 200–299 as OK
  if (res.ok) {
    return res.json();
  }

  // Treat 304 (Not Modified) as “no change / empty list”
  if (res.status === 304) {
    return defaultValue;
  }

  const text = await res.text().catch(() => "");
  console.error("Gateway/finance error:", res.status, text);
  throw new Error(`Finance API error: ${res.status}`);
}

// ---------- BUDGETS (via gateway → budget-service) ----------

export async function fetchBudgets() {
  const res = await fetch(`${API_BASE_URL}/api/budgets`, {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  });
  return safeJson(res, []); // default: empty array
}

export async function createBudget({ category, limit }) {
  const res = await fetch(`${API_BASE_URL}/api/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, limit: Number(limit) }),
  });
  if (!res.ok) throw new Error("Failed to create budget");
  return res.json();
}

export async function updateBudget(id, { category, limit }) {
  const res = await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, limit: Number(limit) }),
  });
  if (!res.ok) throw new Error("Failed to update budget");
  return res.json();
}

export async function deleteBudget(id) {
  const res = await fetch(`${API_BASE_URL}/api/budgets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204)
    throw new Error("Failed to delete budget");
}

export async function patchBudgetSpent(id, amount) {
  const res = await fetch(`${API_BASE_URL}/api/budgets/${id}/spent`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Number(amount) }),
  });
  if (!res.ok) throw new Error("Failed to update budget spent");
  return res.json();
}

// ---------- TRANSACTIONS (via gateway → transact-service) ----------

export async function fetchTransactions() {
  const res = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  });
  return safeJson(res, []); // default: empty array
}

export async function createTransaction(payload) {
  // payload: { type, amount, category, date?, description? }
  const res = await fetch(`${API_BASE_URL}/api/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      amount: Number(payload.amount),
    }),
  });
  if (!res.ok) throw new Error("Failed to create transaction");
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204)
    throw new Error("Failed to delete transaction");
}

export async function fetchSpendingEvents() {
  const res = await fetch(
    `${API_BASE_URL}/api/transactions/events/spending`,
    {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    }
  );
  return safeJson(res, []); // default: empty array
}
