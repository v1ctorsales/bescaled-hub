import { useNavigate } from "react-router-dom";

const STATE_META = {
  "not-started": { label: "Not started", className: "is-not-started", buttonLabel: "Start assessment" },
  "in-progress": { label: "In progress", className: "is-in-progress", buttonLabel: "Continue assessment" },
  completed: { label: "Completed", className: "is-completed", buttonLabel: "Edit assessment" },
};

export default function ActionCard({ to, title, percent }) {
  const navigate = useNavigate();
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const state = clampedPercent >= 100 ? "completed" : clampedPercent > 0 ? "in-progress" : "not-started";
  const meta = STATE_META[state];

  return (
    <div className="action-card">
      <div className="action-card__info">
        <h3 className="action-card__title">{title}</h3>
        <span className={`action-card__status ${meta.className}`}>{meta.label}</span>
      </div>

      <div className="action-card__progress">
        <div className="action-card__progress-bar">
          <div className="action-card__progress-fill" style={{ width: `${clampedPercent}%` }} />
        </div>
        <span className="action-card__progress-label">{Math.round(clampedPercent)}%</span>
      </div>

      <div className="action-card__action">
        <button className="btn-primary" onClick={() => navigate(to)}>
          {meta.buttonLabel}
        </button>
      </div>
    </div>
  );
}
