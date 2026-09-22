import { apiFetch } from "./apiConfig";
import { resetCurrentCompanyCache } from "./companiesService";

// Real Google sign-in: the Google button hands us an ID token (`credential`),
// the backend verifies it, checks the email is authorized and sets an httpOnly
// session cookie. The returned session is { role, name, email, avatar, companyId }.
export async function loginWithGoogle(credential) {
  resetCurrentCompanyCache();
  return apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

// The current session from the cookie, or null when not logged in.
export async function getSession() {
  try {
    return await apiFetch("/auth/me");
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

export async function logout() {
  resetCurrentCompanyCache();
  return apiFetch("/auth/logout", { method: "POST" });
}
