// Overall Innovation Readiness Level completion — table cells + every level
// guide bullet, across all 6 metrics (see utils/readinessProgress.js). Same
// look as the AI Maturity Test's progress bar (components used there:
// .maturity-progress__bar/__fill/__label), under its own class names since
// this isn't sticky like that one.
export default function KthProgressBar({ completed, total }) {
  const percent = total > 0 ? Math.min(100, (completed / total) * 100) : 0;

  return (
    <div className="kth-progress">
      <div className="kth-progress__bar">
        <div className="kth-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="kth-progress__label">
        {completed} of {total} items completed
      </span>
    </div>
  );
}
