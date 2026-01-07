import { authFetch } from "./authFetch";

export async function fetchSpendingAdvice({ days = 30 } = {}) {
  const res = await authFetch(`/api/advice/spending?days=${days}`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Failed to fetch advice (${res.status})`);
  }

  return res.json();
}
