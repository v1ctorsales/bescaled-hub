import { apiFetch } from "./apiConfig";
import { getCurrentCompanyId } from "./companiesService";
import { mergeMaturityAnswers } from "../data/maturityDimensions";

// ---------------------------------------------------------------------------
// The logged-in client's own AI Maturity Test answers. The company id
// comes from the session, same as readinessLevelService.js.
// ---------------------------------------------------------------------------

// The backend returns only the answers it actually has stored — merging
// that into a fully-shaped object (every dimension/stage present) is done
// here, since the dimension/stage rubric (src/data/maturityDimensions.js)
// is frontend-only content the backend doesn't need to know about.
export async function getMaturityTest() {
  const id = await getCurrentCompanyId();
  const { answers, filled } = await apiFetch(`/companies/${id}/maturity-test`);
  return { answers: mergeMaturityAnswers(answers), filled: Boolean(filled) };
}

export async function updateMaturityAnswer(dimensionId, stageId, patch) {
  const id = await getCurrentCompanyId();
  return apiFetch(`/companies/${id}/maturity-test/answers`, {
    method: "PATCH",
    body: JSON.stringify({ dimensionId, stageId, patch }),
  });
}

export async function submitMaturityTest() {
  const id = await getCurrentCompanyId();
  const { filled } = await apiFetch(`/companies/${id}/maturity-test/submit`, { method: "POST" });
  return filled;
}
