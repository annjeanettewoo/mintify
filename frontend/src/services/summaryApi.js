import { authFetch } from "./authFetch";

export async function fetchSpendingSummary({ days = 30 } = {}) {
  const res = await authFetch(`/api/summary/spending?days=${days}`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch summary (${res.status})`);
  }

  return res.json();
}
