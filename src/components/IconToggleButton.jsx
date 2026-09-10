export default function IconToggleButton({ icon, tooltip, active, onClick, variant }) {
  return (
    <button
      type="button"
      className={`icon-toggle-btn ${variant ? `icon-toggle-btn--${variant}` : ""} ${
        active ? "is-active" : ""
      }`}
      data-tooltip={tooltip}
      onClick={onClick}
      aria-label={tooltip}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
}
