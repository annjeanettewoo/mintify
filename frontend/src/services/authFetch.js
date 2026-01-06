import keycloak from "./keycloak";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://gateway.ltu-m7011e-9.se";

export async function authFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  // If not authenticated yet, DON'T call backend (prevents early 401 loops)
  if (!keycloak?.authenticated) {
    throw new Error("Not authenticated yet (Keycloak not ready).");
  }

  try {
    await keycloak.updateToken(30);
  } catch {
    // ignore refresh errors; request may fail
  }

  if (keycloak.token) {
    headers.Authorization = `Bearer ${keycloak.token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // IMPORTANT: do NOT redirect/login here → prevents infinite refresh loop
  if (res.status === 401) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Unauthorized (401)");
  }

  return res;
}
