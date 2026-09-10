import {
  READINESS_METRICS,
  READINESS_METRIC_LABELS,
  READINESS_SCALE_MAX,
} from "../config";

// readinessLevels: { [year]: { CRL, TRL, ... } }
// onChange(year, metric, value)
export default function ReadinessTable({ readinessLevels, years, onChange, editable = true }) {
  return (
    <div className="table-wrapper">
      <table className="readiness-table">
        <thead>
          <tr>
            <th>Metric</th>
            {years.map((year) => (
              <th key={year}>{year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {READINESS_METRICS.map((metric) => (
            <tr key={metric}>
              <td className="readiness-table__label" title={READINESS_METRIC_LABELS[metric]}>
                {metric}
              </td>
              {years.map((year) => (
                <td key={year}>
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      max={READINESS_SCALE_MAX}
                      value={readinessLevels?.[year]?.[metric] ?? 0}
                      onChange={(e) => {
                        let value = Number(e.target.value);
                        if (Number.isNaN(value)) value = 0;
                        value = Math.max(0, Math.min(READINESS_SCALE_MAX, value));
                        onChange(year, metric, value);
                      }}
                    />
                  ) : (
                    <span>{readinessLevels?.[year]?.[metric] ?? 0}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
