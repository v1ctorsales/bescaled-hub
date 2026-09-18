export default function LevelCompletionBar({ percent, completed, total }) {
  const markerPosition = Math.min(96, Math.max(4, percent));

  return (
    <div className="level-progress">
      <div className="level-progress__marker" style={{ left: `${markerPosition}%` }}>
        <span className="level-progress__marker-label">You are here</span>
      </div>
      <div className="level-progress__track">
        <div className="level-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="level-progress__caption">
        {completed}/{total} levels fully marked · {percent}% complete
      </p>
    </div>
  );
}
