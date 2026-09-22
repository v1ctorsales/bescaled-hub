export default function ScoreDots({ score, max = 4 }) {
  return (
    <span className="score-dots" title={`${score} out of ${max}`}>
      <span className="score-dots__value">{score}</span>
      <span className="score-dots__track">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={`score-dots__dot ${i < score ? "is-filled" : ""}`} />
        ))}
      </span>
    </span>
  );
}
