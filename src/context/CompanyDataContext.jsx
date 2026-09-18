import { createContext, useContext, useState } from "react";
import { mockCompanies } from "../data/mockCompanies";
import { mergeMaturityAnswers, allMaturityKeys } from "../data/maturityDimensions";

// ---------------------------------------------------------------------------
// "Current company" data for the logged-in user's dashboard.
// TODO(backend): the current company should come from the authenticated
// user's session/account, not be hardcoded to the first mock company. Reads
// and writes below should become real API calls once a backend exists.
//
// The maturity test answers/progress live here (not inside
// MaturityTestPage's local state) so partial progress survives navigating
// away and back — e.g. the dashboard's "Continue assessment" button reopens
// the form exactly where the respondent left off.
// ---------------------------------------------------------------------------

const MY_COMPANY = mockCompanies[0];

const CompanyDataContext = createContext(null);

export function CompanyDataProvider({ children }) {
  const [readinessLevels, setReadinessLevels] = useState(MY_COMPANY.readinessLevels);
  const [readinessFormFilled, setReadinessFormFilled] = useState(MY_COMPANY.filledReadinessForm);
  const [maturityTestFilled, setMaturityTestFilled] = useState(MY_COMPANY.filledMaturityTest);
  const [maturityAnswers, setMaturityAnswers] = useState(() =>
    mergeMaturityAnswers(MY_COMPANY.maturityAnswers),
  );
  const [maturityTouched, setMaturityTouched] = useState(() =>
    MY_COMPANY.filledMaturityTest ? allMaturityKeys() : new Set(),
  );
  // Self-assessment status ("achieved" | "not-achieved" | "not-applicable")
  // for each level-guide bullet, keyed by "metric:level:bulletIndex". This is
  // purely a reference aid for browsing the guide — it never changes the
  // official readiness score in `readinessLevels`.
  const [guideProgress, setGuideProgress] = useState(MY_COMPANY.guideProgress);

  function updateReadiness(year, metric, value) {
    setReadinessLevels((prev) => ({
      ...prev,
      [year]: { ...prev[year], [metric]: value },
    }));
    setReadinessFormFilled(true);
  }

  function updateGuideProgress(metric, level, bulletIndex, status) {
    const key = `${metric}:${level}:${bulletIndex}`;
    setGuideProgress((prev) => ({
      ...prev,
      [key]: prev[key] === status ? undefined : status,
    }));
  }

  function updateMaturityAnswer(dimensionId, stageId, patch) {
    setMaturityAnswers((prev) => ({
      ...prev,
      [dimensionId]: {
        ...prev[dimensionId],
        [stageId]: { ...prev[dimensionId][stageId], ...patch },
      },
    }));
    setMaturityTouched((prev) => new Set(prev).add(`${dimensionId}:${stageId}`));
  }

  function submitMaturityTest() {
    setMaturityTestFilled(true);
  }

  return (
    <CompanyDataContext.Provider
      value={{
        companyName: MY_COMPANY.name,
        readinessLevels,
        readinessFormFilled,
        updateReadiness,
        guideProgress,
        updateGuideProgress,
        maturityTestFilled,
        maturityAnswers,
        maturityTouched,
        updateMaturityAnswer,
        submitMaturityTest,
      }}
    >
      {children}
    </CompanyDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompanyData() {
  const ctx = useContext(CompanyDataContext);
  if (!ctx) throw new Error("useCompanyData must be used within CompanyDataProvider");
  return ctx;
}
