import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  READINESS_METRICS,
  READINESS_SCALE_MIN,
  READINESS_SCALE_MAX,
  READINESS_YEARS,
} from "../config";
import { levelOrMin } from "../utils/readinessLevel";
import { monthYearToIndex } from "../utils/validation";

// Blue / orange / brown.
const YEAR_COLORS = {
  0: "#2E5CFF",
  1: "#FF8A00",
  2: "#8B5E34",
};

// readinessLevels: { [year]: { CRL, TRL, BRL, IPRL, TmRL, FRL } }
export default function RadarChartView({ readinessLevels, years }) {
  // The legend must always read "10/2026, 02/2027, 09/2027" — the program's
  // reporting periods in order, i.e. READINESS_YEARS — regardless of what
  // order `years` is passed in. Sort by position in that canonical list;
  // anything not in it (shouldn't happen) falls back to calendar order, after.
  const sortedYears = [...years].sort((a, b) => {
    const ai = READINESS_YEARS.indexOf(a);
    const bi = READINESS_YEARS.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return (monthYearToIndex(a) ?? Infinity) - (monthYearToIndex(b) ?? Infinity);
  });

  const data = READINESS_METRICS.map((metric) => {
    const row = { metric };
    sortedYears.forEach((year) => {
      row[year] = levelOrMin(readinessLevels?.[year]?.[metric]);
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis
          angle={30}
          domain={[READINESS_SCALE_MIN, READINESS_SCALE_MAX]}
          tickCount={READINESS_SCALE_MAX - READINESS_SCALE_MIN + 1}
        />
        {sortedYears.map((year, i) => (
          <Radar
            key={year}
            name={String(year)}
            dataKey={year}
            stroke={YEAR_COLORS[i % 3]}
            fill={YEAR_COLORS[i % 3]}
            fillOpacity={0.2}
          />
        ))}
        {/* Explicit payload, in the same chronological order as the Radar series
            above — recharts' default Legend order isn't guaranteed to match it. */}
        <Legend
          payload={sortedYears.map((year, i) => ({
            value: String(year),
            type: "square",
            color: YEAR_COLORS[i % 3],
          }))}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
