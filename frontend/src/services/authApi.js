// frontend/src/services/authApi.js

// For local dev, hard-code the auth-service URL
const AUTH_BASE_URL = "http://localhost:4001";

export async function getPublicMessage() {
  const url = `${AUTH_BASE_URL}/public`;
  console.log("Calling auth-service:", url);

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Auth-service error:", res.status, text);
    throw new Error(`Failed to fetch public message: ${res.status}`);
  }

  return res.json(); // we know /public returns JSON
}