import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ScoreSelector from "../components/ScoreSelector";
import IconToggleButton from "../components/IconToggleButton";
import CommentIcon from "../components/icons/CommentIcon";
import HelpIcon from "../components/icons/HelpIcon";
import { maturityDimensions, MATURITY_STAGES, TOTAL_MATURITY_ITEMS } from "../data/maturityDimensions";
import { exportMaturityXlsx, exportMaturityPdf } from "../utils/export";

// Comment boxes start open only where a comment already exists (review
// mode) — most stages get just a score, so the box stays tucked away
// behind the comment icon until the respondent asks for it.
function keysWithComments(answers) {
  const keys = new Set();
  maturityDimensions.forEach((dimension) => {
    MATURITY_STAGES.forEach((stage) => {
      if (answers[dimension.id][stage.id].comment) {
        keys.add(`${dimension.id}:${stage.id}`);
      }
    });
  });
  return keys;
}

export default function MaturityTestPage() {
  const { user } = useAuth();
  const {
    companyName,
    maturityTestFilled,
    maturityAnswers,
    maturityTouched,
    updateMaturityAnswer,
    submitMaturityTest,
  } = useCompanyData();
  const [testStarted, setTestStarted] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set([maturityDimensions[0].id]));
  const [openComments, setOpenComments] = useState(() => keysWithComments(maturityAnswers));

  if (!user) return <Navigate to="/login" replace />;

  function handleExportXlsx() {
    exportMaturityXlsx(companyName, maturityAnswers);
  }

  function handleExportPdf() {
    exportMaturityPdf(companyName, maturityAnswers);
  }

  function toggleExpanded(dimensionId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(dimensionId)) next.delete(dimensionId);
      else next.add(dimensionId);
      return next;
    });
  }

  function toggleComment(key) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Resumes straight into the form whenever there's any saved progress (not
  // only once fully submitted) so "Continue assessment" from the dashboard
  // picks up exactly where the respondent left off.
  const showForm = testStarted || maturityTouched.size > 0;
  const allReviewed = maturityTouched.size === TOTAL_MATURITY_ITEMS;

  return (
    <div className="page">
      <Header />
      <main className="page__content">
        <div className="page-toolbar">
          <Link to="/dashboard" className="back-link">
            ← Back to dashboard
          </Link>
          <div className="page-toolbar__actions">
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
            <h2>AI Maturity Test</h2>
          </div>

          {!showForm && (
            <div className="maturity-test__intro">
              <p>
                Assess your company's Responsible AI maturity across 9 dimensions. Each
                dimension is broken into 5 stages — rate every stage from 0 to 4, add comments
                if useful, and flag any stage that isn't clear.
              </p>
              <button className="btn-primary" onClick={() => setTestStarted(true)}>
                Start test
              </button>
            </div>
          )}

          {showForm && (
            <div className="maturity-test__form">
              {maturityTestFilled && (
                <div className="maturity-test__submitted-banner">
                  ✓ You've already submitted this test. Review your answers below, or update
                  anything and save your changes.
                </div>
              )}

              <div className="maturity-progress">
                <div className="maturity-progress__bar">
                  <div
                    className="maturity-progress__fill"
                    style={{ width: `${(maturityTouched.size / TOTAL_MATURITY_ITEMS) * 100}%` }}
                  />
                </div>
                <span className="maturity-progress__label">
                  {maturityTouched.size} of {TOTAL_MATURITY_ITEMS} ratings completed
                </span>
              </div>

              {maturityDimensions.map((dimension, index) => {
                const isExpanded = expanded.has(dimension.id);
                const dimensionTouchedCount = MATURITY_STAGES.filter((stage) =>
                  maturityTouched.has(`${dimension.id}:${stage.id}`)
                ).length;

                return (
                  <div key={dimension.id} className="maturity-dimension">
                    <button
                      type="button"
                      className="maturity-dimension__header"
                      onClick={() => toggleExpanded(dimension.id)}
                    >
                      <span className="maturity-dimension__index">{index + 1}</span>
                      <h3 className="maturity-dimension__title">{dimension.title}</h3>
                      <span
                        className={`maturity-dimension__progress ${
                          dimensionTouchedCount === MATURITY_STAGES.length ? "is-complete" : ""
                        }`}
                      >
                        {dimensionTouchedCount}/{MATURITY_STAGES.length}
                      </span>
                      <span className="maturity-dimension__chevron">
                        {isExpanded ? "▾" : "▸"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="maturity-dimension__stages">
                        {MATURITY_STAGES.map((stage) => {
                          const answer = maturityAnswers[dimension.id][stage.id];
                          const key = `${dimension.id}:${stage.id}`;
                          const commentOpen = openComments.has(key);

                          return (
                            <div key={stage.id} className="maturity-stage">
                              <div className="maturity-stage__header">
                                <h4 className="maturity-stage__title">{stage.label}</h4>
                              </div>

                              <div className="maturity-stage__row">
                                <ul className="maturity-stage__criteria">
                                  {dimension.stages[stage.id].map((c) => (
                                    <li key={c}>{c}</li>
                                  ))}
                                </ul>

                                <ScoreSelector
                                  value={answer.score}
                                  disabled={answer.dontUnderstand}
                                  onChange={(score) =>
                                    updateMaturityAnswer(dimension.id, stage.id, { score })
                                  }
                                />

                                <div className="maturity-stage__icons">
                                  <IconToggleButton
                                    icon={<CommentIcon />}
                                    tooltip="Add a comment"
                                    active={commentOpen}
                                    onClick={() => toggleComment(key)}
                                  />
                                  <IconToggleButton
                                    icon={<HelpIcon />}
                                    tooltip="I don't understand this"
                                    active={answer.dontUnderstand}
                                    onClick={() =>
                                      updateMaturityAnswer(dimension.id, stage.id, {
                                        dontUnderstand: !answer.dontUnderstand,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              {commentOpen && (
                                <textarea
                                  className="maturity-dimension__comment"
                                  placeholder="Add context for this rating..."
                                  value={answer.comment}
                                  autoFocus
                                  onChange={(e) =>
                                    updateMaturityAnswer(dimension.id, stage.id, {
                                      comment: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <button className="btn-primary" onClick={submitMaturityTest} disabled={!allReviewed}>
                {maturityTestFilled ? "Save changes" : "Submit answers"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
