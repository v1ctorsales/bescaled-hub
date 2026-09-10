export default function StatusBadge({ filled, labelFilled = "Completed", labelPending = "Pending" }) {
  return (
    <span className={`badge ${filled ? "badge--success" : "badge--pending"}`}>
      {filled ? "✓ " + labelFilled : "○ " + labelPending}
    </span>
  );
}
