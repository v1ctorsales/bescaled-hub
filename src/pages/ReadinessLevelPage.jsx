import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ReadinessTable from "../components/ReadinessTable";
import RadarChartView from "../components/RadarChartView";
import Tabs from "../components/Tabs";
import Thermometer from "../components/Thermometer";
import LevelCompletionBar from "../components/LevelCompletionBar";
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

const CURRENT_YEAR = READINESS_YEARS[0];

function hasMarkedBullets(metric, progress) {
  return Object.keys(progress).some((key) => key.startsWith(`${metric}:`) && progress[key]);
}

function isLevelComplete(metric, level, progress) {
  const bullets = getStageForLevel(metric, level)?.bullets ?? [];
  return bullets.every((_, index) => {
    const status = progress[`${metric}:${level}:${index}`];
    return status === "achieved" || status === "not-applicable";
  });
}

// Overall progress through a metric's guide: the count advances by one level
// for each level fully marked (every bullet Achieved or Not applicable),
// counted as an unbroken streak starting at level 1 — a level completed out
// of order (e.g. level 3 before level 2) doesn't count until every level
// before it is also complete.
function getMetricProgress(metric, progress) {
  const totalLevels = READINESS_SCALE_MAX - READINESS_SCALE_MIN + 1;
  let completeLevelsCount = 0;
  while (
    completeLevelsCount < totalLevels &&
    isLevelComplete(metric, READINESS_SCALE_MIN + completeLevelsCount, progress)
  ) {
    completeLevelsCount += 1;
  }
  return {
    completeLevelsCount,
    totalLevels,
    percent: Math.round((completeLevelsCount / totalLevels) * 100),
  };
}

export default function ReadinessLevelPage() {
  const { user } = useAuth();
  const { companyName, readinessLevels, updateReadiness, guideProgress, updateGuideProgress } =
    useCompanyData();
  const [guideMetric, setGuideMetric] = useState(READINESS_METRICS[0]);
  // Browsing level for the guide — separate from the official score in
  // `readinessLevels` so stepping through the guide never changes the
  // KTH value shown in the table/radar chart above.
  const [previewLevel, setPreviewLevel] = useState(
    readinessLevels?.[CURRENT_YEAR]?.[READINESS_METRICS[0]] ?? READINESS_SCALE_MIN,
  );
  // Auto-open the help modal the first time this page is opened with no
  // progress at all logged yet on the guide's default tab.
  const [isGuideHelpOpen, setIsGuideHelpOpen] = useState(
    () => getMetricProgress(READINESS_METRICS[0], guideProgress).percent === 0,
  );

  if (!user) return <Navigate to="/login" replace />;

  function handleExportXlsx() {
    exportReadinessXlsx(companyName, readinessLevels, guideProgress);
  }

  function handleExportPdf() {
    exportReadinessPdf(companyName, readinessLevels);
  }

  function handleMetricChange(metric) {
    setGuideMetric(metric);
    setPreviewLevel(readinessLevels?.[CURRENT_YEAR]?.[metric] ?? READINESS_SCALE_MIN);
  }

  const guide = READINESS_LEVEL_GUIDE[guideMetric];
  const stage = getStageForLevel(guideMetric, previewLevel);
  const {
    completeLevelsCount,
    totalLevels,
    percent: completionPercent,
  } = getMetricProgress(guideMetric, guideProgress);

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
            <h2>Level guide</h2>
          </div>
          <p className="level-guide__hint">
            Pick a metric and step through the levels below to see what's expected at each stage,
            then mark which points you've already achieved. This is just a reference — it won't
            change your official {CURRENT_YEAR} score, which you set in the table below the chart.
          </p>

          <Tabs
            tabs={READINESS_METRICS.map((metric) => ({
              id: metric,
              label: (
                <>
                  {READINESS_METRIC_LABELS[metric]}
                  {!hasMarkedBullets(metric, guideProgress) && (
                    <span className="tabs__required-asterisk"> *</span>
                  )}
                </>
              ),
            }))}
            activeTab={guideMetric}
            onChange={handleMetricChange}
          />

          <div className="level-guide">
            <h3 className="level-guide__title">{guide.label}</h3>
            <p className="level-guide__intro">{guide.intro}</p>

            <Thermometer value={previewLevel} onChange={setPreviewLevel} />

            <LevelCompletionBar
              percent={completionPercent}
              completed={completeLevelsCount}
              total={totalLevels}
            />

            <div className="level-guide__stage">
              <div className="level-guide__stage-header">
                <span className="level-guide__level-badge">Level {previewLevel}</span>
                <h4>{stage.title}</h4>
              </div>
              {stage.bullets.length > 0 && (
                <ul>
                  {stage.bullets.map((bullet, index) => {
                    const key = `${guideMetric}:${previewLevel}:${index}`;
                    const status = guideProgress[key];
                    return (
                      <li key={bullet} className="level-guide__bullet">
                        <span className="level-guide__bullet-text">{bullet}</span>
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
                              onClick={() =>
                                updateGuideProgress(guideMetric, previewLevel, index, option.id)
                              }
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
            <h2>Current Innovation Readiness Level</h2>
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
              <RadarChartView readinessLevels={readinessLevels} years={READINESS_YEARS} />
            </div>
          </div>
        </section>
      </main>

      {isGuideHelpOpen && (
        <Modal title="About the level guide" onClose={() => setIsGuideHelpOpen(false)}>
          <p>
            The numbers 1–9 match the KTH Innovation Readiness Level (IRL) scale for the metric
            you've selected above.
          </p>
          <p>
            Browsing levels and marking items here is just for your own reference — it never
            changes your official {CURRENT_YEAR} score, which you set separately in the table
            below the chart.
          </p>
          <p>
            For each requirement listed under a level, mark it <strong>Achieved</strong>,{" "}
            <strong>Not achieved</strong>, or <strong>Not applicable</strong> to track where you
            stand.
          </p>
          <p>
            The progress bar fills one level at a time, starting from level 1 — it only advances
            once every requirement of a level is marked Achieved or Not applicable, in order.
          </p>
        </Modal>
      )}
    </div>
  );
}
