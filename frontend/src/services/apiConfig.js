// Central place for the backend's base URL and the fetch wrapper every
// service in this folder uses — the only file that needs to change if the
// API's base path or error-handling convention ever changes.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

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
