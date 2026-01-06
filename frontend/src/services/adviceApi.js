const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export async function fetchSpendingAdvice({ days = 30, token } = {}) {
  const url = new URL("/api/advice/spending", API_BASE);
  url.searchParams.set("days", String(days));

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch AI advice");
  }

  return res.json(); // { summary, advice }
}
