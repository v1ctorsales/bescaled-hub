import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as companiesService from "../services/companiesService";
import * as readinessLevelService from "../services/readinessLevelService";
import * as maturityTestService from "../services/maturityTestService";
import { allMaturityKeys, createBlankMaturityAnswers } from "../data/maturityDimensions";

// ---------------------------------------------------------------------------
// "Current company" data for the logged-in user's dashboard — backed by
// src/services/readinessLevelService.js and src/services/maturityTestService.js
// instead of reading mock data directly. "Current company" is the one the
// session's company user belongs to (only loaded for role "company"; App.jsx
// remounts this provider on login/logout so it never shows stale data).
//
// The maturity test answers/progress live here (not inside
// MaturityTestPage's local state) so partial progress survives navigating
// away and back — e.g. the dashboard's "Continue assessment" button reopens
// the form exactly where the respondent left off.
//
// Maturity test updates are optimistic: local state is set immediately and the
// service call persists each change alongside it (failures surface via `error`).
//
// The KTH readiness form (scores + level guide) works differently: edits only
// change local state — the draft — and nothing is stored until the user hits
// Save, which sends the whole form in one request (`saveReadiness`).
// `saved*` holds what the backend last confirmed; the dashboard reads that, so
// its progress never counts unsaved work.
// ---------------------------------------------------------------------------

const CompanyDataContext = createContext(null);

export function CompanyDataProvider({ children }) {
  const { user } = useAuth();
  const isCompanyUser = user?.role === "company";
  const [companyName, setCompanyName] = useState("");
  const [readinessLevels, setReadinessLevels] = useState({});
  const [readinessFormFilled, setReadinessFormFilled] = useState(false);
  const [maturityTestFilled, setMaturityTestFilled] = useState(false);
  // A fully-shaped blank object (every dimension/stage present) rather than
  // `{}`, so components that index into it (e.g. MaturityTestPage) don't
  // crash while this loads.
  const [maturityAnswers, setMaturityAnswers] = useState(createBlankMaturityAnswers);
  const [maturityTouched, setMaturityTouched] = useState(new Set());
  const [maturitySubmitting, setMaturitySubmitting] = useState(false);
  const [maturitySubmitError, setMaturitySubmitError] = useState(null);
  // Self-assessment status ("achieved" | "not-achieved" | "not-applicable")
  // for each level-guide bullet, keyed by "metric:level:bulletIndex". This is
  // purely a reference aid for browsing the guide — it never changes the
  // official readiness score in `readinessLevels`.
  const [guideProgress, setGuideProgress] = useState({});
  const [savedReadiness, setSavedReadiness] = useState({ readinessLevels: {}, guideProgress: {} });
  const [readinessDirty, setReadinessDirty] = useState(false);
  const [savingReadiness, setSavingReadiness] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(isCompanyUser);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isCompanyUser) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [company, levels, filled, progress, maturity] = await Promise.all([
          companiesService.getCurrentCompany(),
          readinessLevelService.getReadinessLevels(),
          readinessLevelService.isReadinessFormFilled(),
          readinessLevelService.getGuideProgress(),
          maturityTestService.getMaturityTest(),
        ]);
        if (cancelled) return;
        setCompanyName(company?.name ?? "");
        setReadinessLevels(levels);
        setReadinessFormFilled(filled);
        setGuideProgress(progress);
        setSavedReadiness({ readinessLevels: levels, guideProgress: progress });
        setMaturityAnswers(maturity.answers);
        setMaturityTouched(maturity.filled ? allMaturityKeys() : new Set());
        setMaturityTestFilled(maturity.filled);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isCompanyUser]);

  // Local-only until saveReadiness() is called.
  function updateReadiness(year, metric, value) {
    setReadinessLevels((prev) => ({
      ...prev,
      [year]: { ...prev[year], [metric]: value },
    }));
    setReadinessDirty(true);
  }

  // Local-only until saveReadiness() is called. Marking the same status again clears it.
  function updateGuideProgress(metric, level, bulletIndex, status) {
    const key = `${metric}:${level}:${bulletIndex}`;
    setGuideProgress((prev) => ({
      ...prev,
      [key]: prev[key] === status ? undefined : status,
    }));
    setReadinessDirty(true);
  }

  // One request with the whole draft. Returns true on success.
  async function saveReadiness() {
    setSavingReadiness(true);
    setSaveError(null);
    try {
      // Cleared bullets are `undefined` in the draft — leave them out.
      const progress = Object.fromEntries(
        Object.entries(guideProgress).filter(([, status]) => status),
      );
      const saved = await readinessLevelService.saveReadiness(readinessLevels, progress);
      setSavedReadiness({ readinessLevels: saved.readinessLevels, guideProgress: saved.guideProgress });
      setReadinessFormFilled(saved.filled);
      setReadinessDirty(false);
      return true;
    } catch (err) {
      setSaveError(err);
      return false;
    } finally {
      setSavingReadiness(false);
    }
  }

  async function updateMaturityAnswer(dimensionId, stageId, patch) {
    setMaturityAnswers((prev) => ({
      ...prev,
      [dimensionId]: {
        ...prev[dimensionId],
        [stageId]: { ...prev[dimensionId][stageId], ...patch },
      },
    }));
    setMaturityTouched((prev) => new Set(prev).add(`${dimensionId}:${stageId}`));
    try {
      await maturityTestService.updateMaturityAnswer(dimensionId, stageId, patch);
    } catch (err) {
      setError(err);
    }
  }

  // Each rating/comment is already saved as it's entered (updateMaturityAnswer
  // above) — this only flips the "submitted" flag server-side. Mirrors
  // saveReadiness's pattern: state is set from the confirmed result, not
  // optimistically, so a failed request can't leave the UI claiming success.
  async function submitMaturityTest() {
    setMaturitySubmitting(true);
    setMaturitySubmitError(null);
    try {
      await maturityTestService.submitMaturityTest();
      setMaturityTestFilled(true);
    } catch (err) {
      setMaturitySubmitError(err);
    } finally {
      setMaturitySubmitting(false);
    }
  }

  return (
    <CompanyDataContext.Provider
      value={{
        companyName,
        readinessLevels,
        readinessFormFilled,
        updateReadiness,
        guideProgress,
        updateGuideProgress,
        savedReadinessLevels: savedReadiness.readinessLevels,
        savedGuideProgress: savedReadiness.guideProgress,
        readinessDirty,
        savingReadiness,
        saveError,
        saveReadiness,
        maturityTestFilled,
        maturityAnswers,
        maturityTouched,
        updateMaturityAnswer,
        submitMaturityTest,
        maturitySubmitting,
        maturitySubmitError,
        loading,
        error,
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
