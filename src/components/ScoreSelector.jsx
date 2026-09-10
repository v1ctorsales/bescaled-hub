export default function ScoreSelector({ value, onChange, disabled }) {
  return (
    <div className="score-selector" role="group" aria-label="Score from 0 to 4">
      {[0, 1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          className={`score-selector__btn ${value === n ? "is-selected" : ""}`}
          onClick={() => onChange(n)}
          disabled={disabled}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
