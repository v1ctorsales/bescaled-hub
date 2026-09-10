import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCompanyData } from "../context/CompanyDataContext";
import Header from "../components/Header";
import ScoreSelector from "../components/ScoreSelector";
import IconToggleButton from "../components/IconToggleButton";
import {
  maturityDimensions,
  MATURITY_STAGES,
} from "../data/maturityDimensions";

function blankAnswers() {
  const answers = {};
  maturityDimensions.forEach((dimension) => {
    answers[dimension.id] = {};
    MATURITY_STAGES.forEach((stage) => {
      answers[dimension.id][stage.id] = {
        score: 0,
        comment: "",
        dontUnderstand: false,
      };
    });
  });
  return answers;
}

// Defensive merge so a partial/missing saved answer never crashes the form —
// any dimension/stage not present in `saved` falls back to a blank entry.
function mergeWithDefaults(saved) {
  const answers = blankAnswers();
  maturityDimensions.forEach((dimension) => {
    MATURITY_STAGES.forEach((stage) => {
      const existing = saved?.[dimension.id]?.[stage.id];
      if (existing) answers[dimension.id][stage.id] = { ...existing };
    });
  });
  return answers;
}

function allKeys() {
  const keys = new Set();
  maturityDimensions.forEach((dimension) => {
    MATURITY_STAGES.forEach((stage) => keys.add(`${dimension.id}:${stage.id}`));
  });
  return keys;
}

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

const TOTAL_ITEMS = maturityDimensions.length * MATURITY_STAGES.length;

export default function MaturityTestPage() {
  const { user } = useAuth();
  const { maturityTestFilled, maturityAnswers, submitMaturityTest } =
    useCompanyData();
  const [testStarted, setTestStarted] = useState(false);
  const [answers, setAnswers] = useState(() =>
    maturityTestFilled ? mergeWithDefaults(maturityAnswers) : blankAnswers(),
  );
  const [touched, setTouched] = useState(() =>
    maturityTestFilled ? allKeys() : new Set(),
  );
  const [expanded, setExpanded] = useState(
    () => new Set([maturityDimensions[0].id]),
  );
  const [openComments, setOpenComments] = useState(() =>
    keysWithComments(answers),
  );

  if (!user) return <Navigate to="/login" replace />;

  function updateStage(dimensionId, stageId, patch) {
    setAnswers((prev) => ({
      ...prev,
      [dimensionId]: {
        ...prev[dimensionId],
        [stageId]: { ...prev[dimensionId][stageId], ...patch },
      },
    }));
    setTouched((prev) => new Set(prev).add(`${dimensionId}:${stageId}`));
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

  function handleSubmitTest() {
    submitMaturityTest(answers);
  }

  // Once already submitted, the form opens straight away (no "Start test"
  // gate) so the respondent can see their answers exactly like when filling
  // it out the first time, and update them if needed.
  const showForm = testStarted || maturityTestFilled;
  const allReviewed = touched.size === TOTAL_ITEMS;

  return (
    <div className="page">
      <Header title="BeScaled Hub " />
      <main className="page__content">
        <Link to="/dashboard" className="back-link">
          ← Back to dashboard
        </Link>

        <section className="panel">
          <div className="panel__header">
            <h2>AI Maturity Test</h2>
          </div>

          {!showForm && (
            <div className="maturity-test__intro">
              <p>
                Assess your company's Responsible AI maturity across 9
                dimensions. Each dimension is broken into 5 stages — rate every
                stage from 0 to 4, add comments if useful, and flag any stage
                that isn't clear.
              </p>
              <button
                className="btn-primary"
                onClick={() => setTestStarted(true)}
              >
                Start test
              </button>
            </div>
          )}

          {showForm && (
            <div className="maturity-test__form">
              {maturityTestFilled && (
                <div className="maturity-test__submitted-banner">
                  ✓ You've already submitted this test. Review your answers
                  below, or update anything and save your changes.
                </div>
              )}

              <div className="maturity-progress">
                <div className="maturity-progress__bar">
                  <div
                    className="maturity-progress__fill"
                    style={{ width: `${(touched.size / TOTAL_ITEMS) * 100}%` }}
                  />
                </div>
                <span className="maturity-progress__label">
                  {touched.size} of {TOTAL_ITEMS} ratings completed
                </span>
              </div>

              {maturityDimensions.map((dimension, index) => {
                const isExpanded = expanded.has(dimension.id);
                const dimensionTouchedCount = MATURITY_STAGES.filter((stage) =>
                  touched.has(`${dimension.id}:${stage.id}`),
                ).length;

                return (
                  <div key={dimension.id} className="maturity-dimension">
                    <button
                      type="button"
                      className="maturity-dimension__header"
                      onClick={() => toggleExpanded(dimension.id)}
                    >
                      <span className="maturity-dimension__index">
                        {index + 1}
                      </span>
                      <h3 className="maturity-dimension__title">
                        {dimension.title}
                      </h3>
                      <span
                        className={`maturity-dimension__progress ${
                          dimensionTouchedCount === MATURITY_STAGES.length
                            ? "is-complete"
                            : ""
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
                          const answer = answers[dimension.id][stage.id];
                          const key = `${dimension.id}:${stage.id}`;
                          const commentOpen = openComments.has(key);

                          return (
                            <div key={stage.id} className="maturity-stage">
                              <div className="maturity-stage__header">
                                <h4 className="maturity-stage__title">
                                  {stage.label}
                                </h4>
                                <div className="maturity-stage__icons">
                                  <IconToggleButton
                                    icon="💬"
                                    tooltip="Add a comment"
                                    active={commentOpen}
                                    onClick={() => toggleComment(key)}
                                  />
                                  <IconToggleButton
                                    icon="❓"
                                    tooltip="I don't understand this"
                                    active={answer.dontUnderstand}
                                    variant="flag"
                                    onClick={() =>
                                      updateStage(dimension.id, stage.id, {
                                        dontUnderstand: !answer.dontUnderstand,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <ul className="maturity-stage__criteria">
                                {dimension.stages[stage.id].map((c) => (
                                  <li key={c}>{c}</li>
                                ))}
                              </ul>

                              <ScoreSelector
                                value={answer.score}
                                disabled={answer.dontUnderstand}
                                onChange={(score) =>
                                  updateStage(dimension.id, stage.id, { score })
                                }
                              />

                              {commentOpen && (
                                <textarea
                                  className="maturity-dimension__comment"
                                  placeholder="Add context for this rating..."
                                  value={answer.comment}
                                  autoFocus
                                  onChange={(e) =>
                                    updateStage(dimension.id, stage.id, {
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

              <button
                className="btn-primary"
                onClick={handleSubmitTest}
                disabled={!allReviewed}
              >
                {maturityTestFilled ? "Save changes" : "Submit answers"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
