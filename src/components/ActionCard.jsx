import { useNavigate } from "react-router-dom";

export default function ActionCard({ to, icon, title, description, completed }) {
  const navigate = useNavigate();

  return (
    <button className="action-card" onClick={() => navigate(to)}>
      <div className={`action-card__status ${completed ? "is-complete" : "is-pending"}`}>
        {completed ? "✓" : "○"}
      </div>
      <div className="action-card__icon">{icon}</div>
      <div className="action-card__body">
        <h3 className="action-card__title">{title}</h3>
        <p className="action-card__description">{description}</p>
        <span className={`badge ${completed ? "badge--success" : "badge--pending"}`}>
          {completed ? "Completed" : "Not started"}
        </span>
      </div>
      <span className="action-card__chevron">→</span>
    </button>
  );
}
