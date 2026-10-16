import { toCompletionPercent } from "../utils/readinessProgress";

// Overall Innovation Readiness Level completion — every level guide bullet
// plus the table cells of the periods already due, across all 6 metrics (see
// utils/readinessProgress.js). Same counts as the dashboard card. Same
// look as the AI Maturity Test's progress bar (components used there:
// .maturity-progress__bar/__fill/__label), under its own class names since
// this isn't sticky like that one.
export default function KthProgressBar({ completed, total }) {
  const percent = toCompletionPercent(completed, total);

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
