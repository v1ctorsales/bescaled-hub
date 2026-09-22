import { apiFetch } from "./apiConfig";

// Admin-facing company directory — backed by the real API now
// (backend/src/routes/companies.routes.js).

export async function getCompanies() {
  return apiFetch("/companies");
}

export async function getCompanyById(id) {
  return apiFetch(`/companies/${id}`);
}

// The company the currently logged-in company user belongs to.
export async function getCurrentCompany() {
  return apiFetch("/companies/current");
}

// The readiness/maturity services call endpoints under /companies/:id, so they
// resolve the session's company id once and cache it. The cache must be
// cleared whenever the session changes (login/logout) — see authService.js.
let cachedCurrentCompanyId = null;

export async function getCurrentCompanyId() {
  if (cachedCurrentCompanyId == null) {
    const company = await getCurrentCompany();
    cachedCurrentCompanyId = company.id;
  }
  return cachedCurrentCompanyId;
}

export function resetCurrentCompanyCache() {
  cachedCurrentCompanyId = null;
}

export async function updateCompanySettings(companyId, settings) {
  return apiFetch(`/companies/${companyId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}

export async function addCompany({ name, contactEmail, loginEmails, description, batch }) {
  return apiFetch("/companies", {
    method: "POST",
    body: JSON.stringify({ name, contactEmail, loginEmails, description, batch }),
  });
}

export async function deleteCompany(companyId) {
  return apiFetch(`/companies/${companyId}`, { method: "DELETE" });
}
