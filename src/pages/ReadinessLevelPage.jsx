import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ReadinessTable from "../components/ReadinessTable";
import RadarChartView from "../components/RadarChartView";
import Tabs from "../components/Tabs";
import Thermometer from "../components/Thermometer";
import { READINESS_YEARS, READINESS_METRICS, READINESS_METRIC_LABELS } from "../config";
import { downloadJson } from "../utils/export";
import { READINESS_LEVEL_GUIDE, getStageForLevel } from "../data/readinessLevelGuide";

const CURRENT_YEAR = READINESS_YEARS[0];

export default function ReadinessLevelPage() {
  const { user } = useAuth();
  const { companyName, readinessLevels, updateReadiness } = useCompanyData();
  const [guideMetric, setGuideMetric] = useState(READINESS_METRICS[0]);

  if (!user) return <Navigate to="/login" replace />;

  function handleExport() {
    downloadJson(
      { company: companyName, readinessLevels },
      `${companyName.replace(/\s+/g, "_")}_readiness.json`,
    );
  }

  const guide = READINESS_LEVEL_GUIDE[guideMetric];
  const currentLevel = readinessLevels?.[CURRENT_YEAR]?.[guideMetric] ?? 0;
  const stage = getStageForLevel(guideMetric, currentLevel);

  return (
    <div className="page">
      <Header />
      <main className="page__content">
        <Link to="/dashboard" className="back-link">
          ← Back to dashboard
        </Link>

        <section className="panel">
          <div className="panel__header">
            <h2>Current Innovation Readiness Level</h2>
            <button className="btn-secondary" onClick={handleExport}>
              Export my data
            </button>
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

        <section className="panel">
          <div className="panel__header">
            <h2>Level guide</h2>
          </div>
          <p className="level-guide__hint">
            Not sure what number to put in the table above? Pick a metric and step through the
            levels below — moving the thermometer updates your {CURRENT_YEAR} score in the table
            and chart above.
          </p>

          <Tabs
            tabs={READINESS_METRICS.map((metric) => ({
              id: metric,
              label: READINESS_METRIC_LABELS[metric],
            }))}
            activeTab={guideMetric}
            onChange={setGuideMetric}
          />

          <div className="level-guide">
            <h3 className="level-guide__title">{guide.label}</h3>
            <p className="level-guide__intro">{guide.intro}</p>

            <Thermometer
              value={currentLevel}
              onChange={(level) => updateReadiness(CURRENT_YEAR, guideMetric, level)}
            />

            <div className="level-guide__stage">
              <div className="level-guide__stage-header">
                <span className="level-guide__level-badge">Level {currentLevel}</span>
                <h4>{stage.title}</h4>
              </div>
              {stage.bullets.length > 0 && (
                <ul>
                  {stage.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
