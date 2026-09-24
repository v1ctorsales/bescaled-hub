import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ReadinessTable from "../components/ReadinessTable";
import RadarChartView from "../components/RadarChartView";
import Tabs from "../components/Tabs";
import Thermometer from "../components/Thermometer";
import KthProgressBar from "../components/KthProgressBar";
import Modal from "../components/Modal";
import HelpIcon from "../components/icons/HelpIcon";
import {
  READINESS_YEARS,
  READINESS_METRICS,
  READINESS_METRIC_LABELS,
  READINESS_SCALE_MIN,
  READINESS_SCALE_MAX,
} from "../config";
import { exportReadinessXlsx, exportReadinessPdf } from "../utils/export";
import {
  READINESS_LEVEL_GUIDE,
  getStageForLevel,
  BULLET_STATUSES,
} from "../data/readinessLevelGuide";
import { levelOrMin } from "../utils/readinessLevel";
import {
  isLevelAchieved,
  isLevelComplete,
  getReadinessItemCounts,
} from "../utils/readinessProgress";

const CURRENT_YEAR = READINESS_YEARS[0];

// Pause before the guide moves on by itself, so the user sees the item they
// just marked.
const AUTO_ADVANCE_DELAY_MS = 300;

export default function ReadinessLevelPage() {
  const {
    companyName,
    readinessLevels,
    updateReadiness,
    guideProgress,
    updateGuideProgress,
    readinessDirty,
    readinessFormFilled,
    savingReadiness,
    saveError,
    saveReadiness,
    loading,
  } = useCompanyData();
  const [guideMetric, setGuideMetric] = useState(READINESS_METRICS[0]);
  // Browsing level for the guide — separate from the official score in
  // `readinessLevels` so stepping through the guide never changes the
  // KTH value shown in the table/radar chart above. Starts at the scale
  // minimum since data hasn't loaded yet; synced to the real value below
  // once it has.
  const [previewLevel, setPreviewLevel] = useState(READINESS_SCALE_MIN);
  // Auto-open the help modal the first time this page is opened with no
  // progress at all logged yet on the guide's default tab — evaluated once
  // loading finishes, since `guideProgress` is empty until then.
  const [isGuideHelpOpen, setIsGuideHelpOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    function syncInitialGuideState() {
      setPreviewLevel(
        levelOrMin(readinessLevels?.[CURRENT_YEAR]?.[guideMetric]),
      );
      if (getReadinessItemCounts(readinessLevels, guideProgress).completed === 0) {
        setIsGuideHelpOpen(true);
      }
    }
    syncInitialGuideState();
    // Only re-run when the initial load finishes — this is a one-time
    // "first visit" sync, not a live subscription to guideProgress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Pending auto-advance (see handleMarkBullet); never outlives the page.
  const advanceTimer = useRef(null);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  // Unsaved edits live only in memory — warn before a refresh/close loses them.
  useEffect(() => {
    if (!readinessDirty) return;
    function warn(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [readinessDirty]);

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="page__content">
          <p className="loading-state">Loading your readiness data…</p>
        </main>
      </div>
    );
  }

  function handleExportXlsx() {
    exportReadinessXlsx(companyName, readinessLevels, guideProgress);
  }

  function handleExportPdf() {
    exportReadinessPdf(companyName, readinessLevels);
  }

  // Marks a bullet, then reacts to what that click completed:
  // - every bullet of the level "achieved" → the official score for the current
  //   period moves up to that level (only ever raised, never lowered; still
  //   editable in the table);
  // - the level went from unfinished to fully answered (any status) → the guide
  //   moves on to the next level, or after level 9 to the next metric, after a
  //   short pause so the marked item stays visible for a moment.
  // Re-marking a bullet in a level that was already fully answered doesn't move on.
  function handleMarkBullet(index, status) {
    const key = `${guideMetric}:${previewLevel}:${index}`;
    const nextStatus = guideProgress[key] === status ? undefined : status;
    const nextProgress = { ...guideProgress, [key]: nextStatus };
    updateGuideProgress(guideMetric, previewLevel, index, status);

    const currentScore = readinessLevels?.[CURRENT_YEAR]?.[guideMetric] ?? 0;
    if (
      isLevelAchieved(guideMetric, previewLevel, nextProgress) &&
      previewLevel > currentScore
    ) {
      updateReadiness(CURRENT_YEAR, guideMetric, previewLevel);
    }

    const justFinished =
      !isLevelComplete(guideMetric, previewLevel, guideProgress) &&
      isLevelComplete(guideMetric, previewLevel, nextProgress);
    if (!justFinished) return;

    const nextMetric =
      READINESS_METRICS[READINESS_METRICS.indexOf(guideMetric) + 1];
    const advance =
      previewLevel < READINESS_SCALE_MAX
        ? () => setPreviewLevel(previewLevel + 1)
        : nextMetric && (() => handleMetricChange(nextMetric));
    if (!advance) return;

    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(advance, AUTO_ADVANCE_DELAY_MS);
  }

  // Picking a level or metric by hand cancels a pending auto-advance.
  function handleLevelChange(level) {
    clearTimeout(advanceTimer.current);
    setPreviewLevel(level);
  }

  function handleMetricChange(metric) {
    clearTimeout(advanceTimer.current);
    setGuideMetric(metric);
    setPreviewLevel(levelOrMin(readinessLevels?.[CURRENT_YEAR]?.[metric]));
  }

  const guide = READINESS_LEVEL_GUIDE[guideMetric];
  const stage = getStageForLevel(guideMetric, previewLevel);
  const currentLevel = levelOrMin(readinessLevels?.[CURRENT_YEAR]?.[guideMetric]);
  const { completed: readinessItemsCompleted, total: readinessItemsTotal } =
    getReadinessItemCounts(readinessLevels, guideProgress);

  return (
    <div className="page">
      <Header />
      <main className="page__content">
        <div className="page-toolbar">
          <Link to="/dashboard" className="back-link">
            ← Back to dashboard
          </Link>
          <div className="page-toolbar__actions">
            <button
              type="button"
              className="icon-toggle-btn"
              aria-label="About the level guide"
              aria-haspopup="dialog"
              onClick={() => setIsGuideHelpOpen(true)}
            >
              <HelpIcon />
            </button>
            <button className="btn-secondary" onClick={handleExportXlsx}>
              Export XLSX
            </button>
            <button className="btn-primary" onClick={handleExportPdf}>
              Export PDF
            </button>
          </div>
        </div>

        <section className="panel">
          <div className="panel__header">
            <h2>KTH - Innovation Readiness Level</h2>
          </div>
          <p className="level-guide__hint">
            Pick a metric and step through the levels below to see what's
            expected at each stage, then mark which points you've already
            achieved. When every point of a level is marked Achieved, your{" "}
            {CURRENT_YEAR} score for that metric moves up to that level
            automatically — you can still adjust it in the table below the
            chart.
          </p>

          <Tabs
            tabs={READINESS_METRICS.map((metric) => ({
              id: metric,
              label: (
                <>
                  {READINESS_METRIC_LABELS[metric]}
                  {!isLevelComplete(
                    metric,
                    READINESS_SCALE_MIN,
                    guideProgress,
                  ) && <span className="tabs__required-asterisk"> *</span>}
                </>
              ),
            }))}
            activeTab={guideMetric}
            onChange={handleMetricChange}
          />

          <div className="level-guide">
            <h3 className="level-guide__title">{guide.label}</h3>
            <p className="level-guide__intro">{guide.intro}</p>

            <Thermometer
              value={previewLevel}
              onChange={handleLevelChange}
              markedLevel={currentLevel}
            />

            <KthProgressBar completed={readinessItemsCompleted} total={readinessItemsTotal} />

            {/* Keyed by metric + level so every level change replays the entrance animation. */}
            <div
              key={`${guideMetric}:${previewLevel}`}
              className="level-guide__stage"
            >
              <div className="level-guide__stage-header">
                <span className="level-guide__level-badge">
                  Level {previewLevel}
                </span>
                <h4>{stage.title}</h4>
              </div>
              {stage.bullets.length > 0 && (
                <ul>
                  {stage.bullets.map((bullet, index) => {
                    const key = `${guideMetric}:${previewLevel}:${index}`;
                    const status = guideProgress[key];
                    return (
                      <li key={bullet} className="level-guide__bullet">
                        <span className="level-guide__bullet-text">
                          {bullet}
                        </span>
                        <div
                          className="level-guide__bullet-actions"
                          role="group"
                          aria-label="Mark this item"
                        >
                          {BULLET_STATUSES.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`level-guide__bullet-btn level-guide__bullet-btn--${option.id} ${
                                status === option.id ? "is-active" : ""
                              }`}
                              onClick={() => handleMarkBullet(index, option.id)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <h2>KTH - Current Innovation Readiness Level</h2>
          </div>

          <div className="readiness-layout">
            <div className="readiness-layout__table">
              <ReadinessTable
                readinessLevels={readinessLevels}
                years={READINESS_YEARS}
                onChange={updateReadiness}
              />
            </div>
            <div className="readiness-layout__chart">
              <RadarChartView
                readinessLevels={readinessLevels}
                years={READINESS_YEARS}
              />
            </div>
          </div>
        </section>

        <div className="submit-block">
          {saveError ? (
            <p className="submit-block__status is-error" role="alert">
              Couldn't submit your answers. Try again.
            </p>
          ) : readinessDirty ? (
            <p className="submit-block__status">You have unsaved changes.</p>
          ) : (
            readinessFormFilled && (
              <p className="submit-block__status">
                ✓ All your answers are submitted.
              </p>
            )
          )}
          <button
            className="btn-primary"
            onClick={saveReadiness}
            disabled={
              savingReadiness || (!readinessDirty && readinessFormFilled)
            }
          >
            {savingReadiness ? "Submitting…" : "Submit answers"}
          </button>
        </div>
      </main>

      {isGuideHelpOpen && (
        <Modal
          title="About the level guide"
          onClose={() => setIsGuideHelpOpen(false)}
        >
          <p>
            The numbers 1–9 match the KTH Innovation Readiness Level (IRL) scale
            for the metric you've selected above.
          </p>
          <p>
            When you mark every requirement of a level as{" "}
            <strong>Achieved</strong>, your {CURRENT_YEAR} score for that metric
            is raised to that level automatically (it is never lowered
            automatically). You can always adjust it in the table below the
            chart.
          </p>
          <p>
            For each requirement listed under a level, mark it{" "}
            <strong>Achieved</strong>, <strong>Not achieved</strong>, or{" "}
            <strong>Not applicable</strong> to track where you stand.
          </p>
          <p>
            The 🚩 above the level selector marks your metric's current
            official score — it stays there even while you browse other
            levels. The bar below the selector is your overall progress: how
            much of the readiness table and the level guide, across every
            metric, you've filled in so far.
          </p>
          <p>
            Once you have answered every requirement of a level, the guide moves
            on to the next level by itself — and after level 9, to the next
            metric.
          </p>
          <p>
            Nothing is stored until you press <strong>Submit answers</strong> —
            it sends your scores and your level guide answers together, and only
            then does your dashboard progress update.
          </p>
        </Modal>
      )}
    </div>
  );
}
