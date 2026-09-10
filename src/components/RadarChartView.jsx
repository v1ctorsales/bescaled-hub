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
import { READINESS_METRICS, READINESS_SCALE_MAX } from "../config";

const YEAR_COLORS = {
  0: "#2E5CFF",
  1: "#00B37E",
  2: "#FF8A00",
};

// readinessLevels: { [year]: { CRL, TRL, BRL, IPRL, TmRL, FRL } }
export default function RadarChartView({ readinessLevels, years }) {
  const data = READINESS_METRICS.map((metric) => {
    const row = { metric };
    years.forEach((year) => {
      row[year] = readinessLevels?.[year]?.[metric] ?? 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis angle={30} domain={[0, READINESS_SCALE_MAX]} tickCount={5} />
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
