export default function IconToggleButton({ icon, tooltip, active, onClick }) {
  return (
    <button
      type="button"
      className={`icon-toggle-btn ${active ? "is-active" : ""}`}
      data-tooltip={tooltip}
      onClick={onClick}
      aria-label={tooltip}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
