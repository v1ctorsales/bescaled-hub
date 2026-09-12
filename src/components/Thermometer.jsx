const LEVELS = Array.from({ length: 10 }, (_, i) => i); // 0-9

// Cool-to-warm gradient (teal -> amber) so the scale reads like a
// thermometer, independent of the app's blue/teal brand accents.
function colorForLevel(level) {
  const hue = 185 - (level / (LEVELS.length - 1)) * 155; // 185 (teal) -> 30 (amber)
  return `hsl(${hue}, 70%, 45%)`;
}

export default function Thermometer({ value, onChange }) {
  return (
    <div className="thermometer" role="group" aria-label="Level from 0 to 9">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          className={`thermometer__step ${level === value ? "is-current" : ""}`}
          style={{ backgroundColor: colorForLevel(level) }}
          onClick={() => onChange(level)}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
