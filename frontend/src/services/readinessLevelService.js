import { apiFetch } from "./apiConfig";
import { getCurrentCompanyId } from "./companiesService";

// ---------------------------------------------------------------------------
// The logged-in company user's own Innovation Readiness Level data. Every export
// takes no companyId param — the id comes from the session (via
// getCurrentCompanyId in companiesService.js, which caches it).
// ---------------------------------------------------------------------------

export async function getReadinessLevels() {
  const id = await getCurrentCompanyId();
  return apiFetch(`/companies/${id}/readiness-level`);
}

export async function isReadinessFormFilled() {
  const id = await getCurrentCompanyId();
  const { filled } = await apiFetch(`/companies/${id}/readiness-level/filled`);
  return filled;
}

export async function getGuideProgress() {
  const id = await getCurrentCompanyId();
  return apiFetch(`/companies/${id}/guide-progress`);
}

// Saves the whole KTH form (scores + level-guide progress) in a single request.
// Returns the stored { readinessLevels, guideProgress, filled }.
export async function saveReadiness(readinessLevels, guideProgress) {
  const id = await getCurrentCompanyId();
  return apiFetch(`/companies/${id}/readiness-level`, {
    method: "PUT",
    body: JSON.stringify({ readinessLevels, guideProgress }),
  });
}
