// frontend/src/services/authApi.js

// Use env var in prod, fall back to localhost for dev
const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:4001";

export async function getPublicMessage() {
  const url = `${AUTH_BASE_URL}/public`;
  console.log("Calling auth-service:", url);

  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Auth-service error:", res.status, text);
    throw new Error(`Failed to fetch public message: ${res.status}`);
  }

  return res.json(); // /public returns JSON
}
