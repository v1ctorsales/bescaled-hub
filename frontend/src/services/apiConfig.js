// Central place for the backend's base URL and the fetch wrapper every
// service in this folder uses — the only file that needs to change if the
// API's base path or error-handling convention ever changes.
//
// Production uses relative /api: Caddy proxies it in the VPS setup, while
// frontend/vercel.json rewrites it to Cloud Run in the Vercel setup. Both
// keep browser API requests same-origin. Local dev sets VITE_API_BASE_URL
// to the backend URL because Vite has no API proxy. See README.md and
// docs/CLOUD-DEPLOY.md at the repository root.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // Sends/receives the HTTP-only session cookie, including cross-origin local dev.
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
