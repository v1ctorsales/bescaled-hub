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
import { READINESS_METRICS, READINESS_SCALE_MIN, READINESS_SCALE_MAX } from "../config";

// Blue / orange / brown.
const YEAR_COLORS = {
  0: "#2E5CFF",
  1: "#FF8A00",
  2: "#8B5E34",
};

// readinessLevels: { [year]: { CRL, TRL, BRL, IPRL, TmRL, FRL } }
export default function RadarChartView({ readinessLevels, years }) {
  const data = READINESS_METRICS.map((metric) => {
    const row = { metric };
    years.forEach((year) => {
      row[year] = readinessLevels?.[year]?.[metric] ?? READINESS_SCALE_MIN;
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
        {years.map((year, i) => (
          <Radar
            key={year}
            name={String(year)}
            dataKey={year}
            stroke={YEAR_COLORS[i % 3]}
            fill={YEAR_COLORS[i % 3]}
            fillOpacity={0.2}
          />
        ))}
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
