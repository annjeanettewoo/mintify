// src/services/summaryApi.js
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"; // change if needed

export async function fetchSpendingSummary({ days = 30, token } = {}) {
  const url = new URL("/api/summary/spending", API_BASE);
  url.searchParams.set("days", String(days));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include", // ok to keep; remove if you don't use cookies
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch spending summary (${res.status}). ${text}`);
  }

  return res.json();
}

