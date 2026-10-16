import {
  READINESS_METRICS,
  READINESS_METRIC_LABELS,
  READINESS_SCALE_MIN,
  READINESS_SCALE_MAX,
} from "../config";
import { isPeriodDue } from "../utils/readinessPeriods";

const EMPTY_CELL = "–";

// The backend stores 0 for "not filled in yet" — show that as an empty cell
// rather than as the scale minimum, so it doesn't look filled in.
function cellValue(value) {
  return Number.isFinite(value) && value >= READINESS_SCALE_MIN ? value : null;
}

// readinessLevels: { [year]: { CRL, TRL, ... } }
// onChange(year, metric, value)
// Periods that aren't due yet stay editable but are marked as such.
export default function ReadinessTable({ readinessLevels, years, onChange, editable = true }) {
  const hasPeriodsNotDue = years.some((year) => !isPeriodDue(year));

  return (
    <div className="table-wrapper">
      <table className="readiness-table">
        <thead>
          <tr>
            <th>Metric</th>
            {years.map((year) =>
              isPeriodDue(year) ? (
                <th key={year}>{year}</th>
              ) : (
                <th key={year} className="readiness-table__period--not-due">
                  {year}
                  <span className="readiness-table__not-due-label">not yet due</span>
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {READINESS_METRICS.map((metric) => (
            <tr key={metric}>
              <td className="readiness-table__label" title={READINESS_METRIC_LABELS[metric]}>
                {metric}
              </td>
              {years.map((year) => {
                const value = cellValue(readinessLevels?.[year]?.[metric]);
                return (
                  <td key={year}>
                    {editable ? (
                      <input
                        type="number"
                        min={READINESS_SCALE_MIN}
                        max={READINESS_SCALE_MAX}
                        value={value ?? ""}
                        placeholder={EMPTY_CELL}
                        onChange={(e) => {
                          let value = Number(e.target.value);
                          if (Number.isNaN(value)) value = READINESS_SCALE_MIN;
                          value = Math.max(READINESS_SCALE_MIN, Math.min(READINESS_SCALE_MAX, value));
                          onChange(year, metric, value);
                        }}
                      />
                    ) : (
                      <span>{value ?? EMPTY_CELL}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {hasPeriodsNotDue && (
        <p className="readiness-table__note">
          Periods marked "not yet due" haven't started yet. You can fill them in
          ahead of time, but they only count toward progress once that month
          begins.
        </p>
      )}
    </div>
  );
}
