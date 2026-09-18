import { useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Tabs from "../components/Tabs";
import StatusBadge from "../components/StatusBadge";
import ScoreDots from "../components/ScoreDots";
import ReadinessTable from "../components/ReadinessTable";
import RadarChartView from "../components/RadarChartView";
import Thermometer from "../components/Thermometer";
import IconToggleButton from "../components/IconToggleButton";
import SettingsIcon from "../components/icons/SettingsIcon";
import CompanySettingsModal from "../components/CompanySettingsModal";
import {
  mockCompanies,
  updateCompanySettings,
  deleteCompany,
} from "../data/mockCompanies";
import {
  maturityDimensions,
  MATURITY_STAGES,
} from "../data/maturityDimensions";
import {
  READINESS_YEARS,
  READINESS_METRICS,
  READINESS_METRIC_LABELS,
  READINESS_SCALE_MIN,
} from "../config";
import {
  READINESS_LEVEL_GUIDE,
  BULLET_STATUS_LABELS,
} from "../data/readinessLevelGuide";
import { exportCompanyXlsx, exportCompanyPdf } from "../utils/adminExport";

const CURRENT_YEAR = READINESS_YEARS[0];

// The KTH level guide is 1-indexed per metric (levels 1-9); this walks every
// level in order and returns every bullet, marked or not, so the admin sees
// the full checklist rather than only what the company has already marked.
function getGuideEntries(metric, guideProgress) {
  const guide = READINESS_LEVEL_GUIDE[metric];
  return Object.keys(guide.stages)
    .map(Number)
    .sort((a, b) => a - b)
    .map((level) => {
      const bullets = guide.stages[level].bullets ?? [];
      return {
        level,
        title: guide.stages[level].title,
        bullets: bullets.map((bullet, index) => ({
          bullet,
          status: guideProgress?.[`${metric}:${level}:${index}`],
        })),
      };
    });
}

export default function CompanyDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("readiness");
  const [guideMetric, setGuideMetric] = useState(READINESS_METRICS[0]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const company = mockCompanies.find((c) => c.id === Number(id));
  if (!company) return <Navigate to="/admin" replace />;

  const guideEntries = getGuideEntries(guideMetric, company.guideProgress);
  const companyGuideLevel =
    company.readinessLevels?.[CURRENT_YEAR]?.[guideMetric] ?? READINESS_SCALE_MIN;

  function handleDelete() {
    deleteCompany(company.id);
    navigate("/admin");
  }

  return (
    <div className="page">
      <Header subtitle="Admin" />
      <main className="page__content">
        <Link to="/admin" className="back-link">
          ← Back to companies
        </Link>

        <section className="panel">
          <div className="panel__header">
            <div className="company-detail__heading">
              <h2>{company.name}</h2>
              <span className="company-detail__email">
                {company.contactEmail}
              </span>
            </div>
            <div className="panel__actions">
              <span
                className={`badge ${company.subscribed ? "badge--success" : "badge--pending"}`}
              >
                {company.subscribed ? "Subscribed" : "Not subscribed"}
              </span>
              <button
                className="btn-secondary"
                onClick={() => exportCompanyXlsx(company)}
              >
                Export XLSX
              </button>
              <button
                className="btn-primary"
                onClick={() => exportCompanyPdf(company)}
              >
                Export PDF
              </button>
              <IconToggleButton
                icon={<SettingsIcon />}
                tooltip="Company settings"
                onClick={() => setSettingsOpen(true)}
              />
            </div>
          </div>

          <Tabs
            tabs={[
              { id: "readiness", label: "KTH - Innovation Readiness Level" },
              { id: "maturity", label: "AI Maturity Test" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {activeTab === "readiness" && (
            <div className="tab-panel">
              <div className="tab-panel__status">
                <StatusBadge filled={company.filledReadinessForm} />
              </div>
              {company.filledReadinessForm ? (
                <div className="readiness-layout">
                  <div className="readiness-layout__table">
                    <ReadinessTable
                      readinessLevels={company.readinessLevels}
                      years={READINESS_YEARS}
                      editable={false}
                    />
                  </div>
                  <div className="readiness-layout__chart">
                    <RadarChartView
                      readinessLevels={company.readinessLevels}
                      years={READINESS_YEARS}
                    />
                  </div>
                </div>
              ) : (
                <p className="tab-panel__empty">
                  This company hasn't completed the Readiness Level assessment
                  yet.
                </p>
              )}

              <div className="kth-bullets">
                <h3 className="kth-bullets__title">KTH level guide</h3>
                <Tabs
                  tabs={READINESS_METRICS.map((metric) => ({
                    id: metric,
                    label: READINESS_METRIC_LABELS[metric],
                  }))}
                  activeTab={guideMetric}
                  onChange={setGuideMetric}
                />

                <div className="level-progress">
                  <div
                    className="level-progress__marker"
                    style={{ left: `${((companyGuideLevel - 0.5) / 9) * 100}%` }}
                  >
                    <span className="level-progress__marker-label">
                      {company.name} is here
                    </span>
                  </div>
                  <Thermometer value={companyGuideLevel} readOnly />
                </div>

                {guideEntries.map(({ level, title, bullets }) => (
                  <div key={level} className="level-guide__stage kth-bullets__stage">
                    <div className="level-guide__stage-header">
                      <span className="level-guide__level-badge">Level {level}</span>
                      <h4>{title}</h4>
                    </div>
                    <ul>
                      {bullets.map(({ bullet, status }) => (
                        <li key={bullet} className="level-guide__bullet">
                          <span className="level-guide__bullet-text">{bullet}</span>
                          <span
                            className={`kth-bullets__status kth-bullets__status--${status || "unmarked"}`}
                          >
                            {status ? BULLET_STATUS_LABELS[status] : "Not marked"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "maturity" && (
            <div className="tab-panel">
              <div className="tab-panel__status">
                <StatusBadge filled={company.filledMaturityTest} />
              </div>
              {company.filledMaturityTest ? (
                <div className="maturity-answers">
                  {maturityDimensions.map((dimension, index) => (
                    <div key={dimension.id} className="maturity-answers__item">
                      <div className="maturity-answers__item-header">
                        <span className="maturity-dimension__index">
                          {index + 1}
                        </span>
                        <p className="maturity-question__title">
                          {dimension.title}
                        </p>
                      </div>
                      <div className="table-wrapper">
                        <table className="maturity-stage-table">
                          <colgroup>
                            <col className="maturity-stage-table__col-stage" />
                            <col className="maturity-stage-table__col-score" />
                            <col className="maturity-stage-table__col-comment" />
                            <col className="maturity-stage-table__col-flag" />
                          </colgroup>
                          <thead>
                            <tr>
                              <th>Stage</th>
                              <th>Score</th>
                              <th>Comment</th>
                              <th>Flag</th>
                            </tr>
                          </thead>
                          <tbody>
                            {MATURITY_STAGES.map((stage) => {
                              const answer =
                                company.maturityAnswers?.[dimension.id]?.[
                                  stage.id
                                ];
                              return (
                                <tr key={stage.id}>
                                  <td>{stage.label}</td>
                                  <td>
                                    {answer ? (
                                      <ScoreDots score={answer.score} />
                                    ) : (
                                      <span className="maturity-stage-table__muted">
                                        —
                                      </span>
                                    )}
                                  </td>
                                  <td className="maturity-stage-table__comment">
                                    {answer?.comment ? (
                                      `"${answer.comment}"`
                                    ) : (
                                      <span className="maturity-stage-table__muted">
                                        No comment
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {answer?.dontUnderstand ? (
                                      <span className="badge badge--pending">
                                        ⚠ Unclear
                                      </span>
                                    ) : (
                                      <span className="maturity-stage-table__muted">
                                        —
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tab-panel__empty">
                  This company hasn't completed the AI Maturity Test yet.
                </p>
              )}
            </div>
          )}
        </section>
      </main>

      {settingsOpen && (
        <CompanySettingsModal
          company={company}
          onClose={() => setSettingsOpen(false)}
          onSave={(settings) => updateCompanySettings(company.id, settings)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
