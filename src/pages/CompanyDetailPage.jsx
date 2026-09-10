import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Tabs from "../components/Tabs";
import StatusBadge from "../components/StatusBadge";
import ScoreDots from "../components/ScoreDots";
import ReadinessTable from "../components/ReadinessTable";
import RadarChartView from "../components/RadarChartView";
import { mockCompanies } from "../data/mockCompanies";
import {
  maturityDimensions,
  MATURITY_STAGES,
} from "../data/maturityDimensions";
import { READINESS_YEARS } from "../config";
import { exportCompanyCsv, exportCompanyPdf } from "../utils/adminExport";

export default function CompanyDetailPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("readiness");

  if (!user) return <Navigate to="/login" replace />;

  const company = mockCompanies.find((c) => c.id === Number(id));
  if (!company) return <Navigate to="/admin" replace />;

  return (
    <div className="page">
      <Header title="BeScaled Hub  (admin)" />
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
                onClick={() => exportCompanyCsv(company)}
              >
                Export CSV
              </button>
              <button
                className="btn-primary"
                onClick={() => exportCompanyPdf(company)}
              >
                Export PDF
              </button>
            </div>
          </div>

          <Tabs
            tabs={[
              { id: "readiness", label: "Innovation Readiness Level" },
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
                <>
                  <ReadinessTable
                    readinessLevels={company.readinessLevels}
                    years={READINESS_YEARS}
                    editable={false}
                  />
                  <RadarChartView
                    readinessLevels={company.readinessLevels}
                    years={READINESS_YEARS}
                  />
                </>
              ) : (
                <p className="tab-panel__empty">
                  This company hasn't completed the Readiness Level assessment
                  yet.
                </p>
              )}
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
    </div>
  );
}
