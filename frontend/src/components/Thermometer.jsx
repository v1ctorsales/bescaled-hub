const LEVELS = Array.from({ length: 9 }, (_, i) => i + 1); // 1-9

// Red (1-3) -> Yellow (4-6) -> Green (7-9), shaded darker to lighter within
// each band so the scale still reads correctly in grayscale or for
// colorblind users, instead of relying on hue alone.
function colorForLevel(level) {
  const shade = (level - 1) % 3; // 0, 1, 2 — position within its band
  if (level <= 3) return `hsl(3, 65%, ${30 + shade * 8}%)`;
  if (level <= 6) return `hsl(45, 80%, ${35 + shade * 8}%)`;
  return `hsl(150, 45%, ${28 + shade * 8}%)`;
}

// The mid-band yellow is too light for white text to stay readable on it.
function textColorForLevel(level) {
  return level >= 4 && level <= 6 ? "#1a1a1a" : "#fff";
}

export default function Thermometer({ value, onChange, readOnly = false }) {
  return (
    <div
      className={`thermometer ${readOnly ? "is-read-only" : ""}`}
      role="group"
      aria-label="Level from 1 to 9"
    >
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          className={`thermometer__step ${level === value ? "is-current" : ""}`}
          style={{ backgroundColor: colorForLevel(level), color: textColorForLevel(level) }}
          onClick={readOnly ? undefined : () => onChange(level)}
          disabled={readOnly}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
