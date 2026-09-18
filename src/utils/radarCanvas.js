import { READINESS_METRICS, READINESS_SCALE_MAX } from "../config";

// Matches the colors used by src/components/RadarChartView.jsx (recharts),
// redrawn here with plain Canvas 2D so it can be rasterized into a PNG for
// PDF export without needing to screenshot the live chart.
const YEAR_COLORS = ["#2E5CFF", "#FF8A00", "#8B5E34"];

export function renderRadarChartImage(readinessLevels, years, { size = 480 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const center = size / 2;
  const chartCenterY = size * 0.46;
  const radius = size * 0.33;
  const metrics = READINESS_METRICS;
  const n = metrics.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  function pointFor(i, fraction) {
    const angle = startAngle + i * angleStep;
    return {
      x: center + Math.cos(angle) * radius * fraction,
      y: chartCenterY + Math.sin(angle) * radius * fraction,
    };
  }

  ctx.strokeStyle = "#e3e4ea";
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1].forEach((frac) => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const p = pointFor(i % n, frac);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  });

  ctx.strokeStyle = "#c7c9d6";
  ctx.fillStyle = "#4b4a55";
  ctx.font = `${Math.round(size * 0.028)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  metrics.forEach((metric, i) => {
    const edge = pointFor(i, 1);
    ctx.beginPath();
    ctx.moveTo(center, chartCenterY);
    ctx.lineTo(edge.x, edge.y);
    ctx.stroke();

    const label = pointFor(i, 1.16);
    ctx.fillText(metric, label.x, label.y);
  });

  years.forEach((year, yi) => {
    const color = YEAR_COLORS[yi % YEAR_COLORS.length];
    ctx.beginPath();
    metrics.forEach((metric, i) => {
      const value = readinessLevels?.[year]?.[metric] ?? 0;
      const fraction = Math.max(0, Math.min(1, value / READINESS_SCALE_MAX));
      const p = pointFor(i, fraction);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = `${color}33`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  const legendY = size - 20;
  let legendX = center - (years.length * size * 0.15) / 2;
  ctx.font = `${Math.round(size * 0.026)}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  years.forEach((year, yi) => {
    const color = YEAR_COLORS[yi % YEAR_COLORS.length];
    ctx.fillStyle = color;
    ctx.fillRect(legendX, legendY - 5, 10, 10);
    ctx.fillStyle = "#4b4a55";
    ctx.fillText(String(year), legendX + 14, legendY);
    legendX += size * 0.15;
  });

  return canvas.toDataURL("image/png");
}
