// Central place for the backend's base URL and the fetch wrapper every
// service in this folder uses — the only file that needs to change if the
// API's base path or error-handling convention ever changes.
//
// The fallback is relative (`/api`), not an absolute URL: in production,
// frontend/vercel.json rewrites `/api/*` to the Cloud Run backend server-side
// (see backend/README.md — "Proxy (Vercel rewrite)"), so the browser only
// ever talks to the same site it's on, and the session cookie can stay
// same-site (SameSite=Lax) instead of needing SameSite=None. Local dev sets
// VITE_API_BASE_URL explicitly (frontend/.env, see .env.example) to talk to
// the backend directly, since there's no rewrite running there.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Sends/receives the httpOnly session cookie (cross-origin in dev and prod).
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error(body?.error || `Request to ${path} failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined;
  return response.json();
}
