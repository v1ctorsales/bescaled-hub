import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { renderRadarChartImage } from "./radarCanvas";
import { READINESS_METRICS, READINESS_METRIC_LABELS, READINESS_YEARS } from "../config";
import {
  READINESS_LEVEL_GUIDE,
  BULLET_STATUS_LABELS,
} from "../data/readinessLevelGuide";
import { maturityDimensions, MATURITY_STAGES } from "../data/maturityDimensions";

// Small helpers to let export buttons actually produce a downloadable file
// instead of being pure placeholders.

export async function downloadXlsx(rows, filename, sheetName = "Sheet1") {
  if (!rows.length) return;
  await downloadXlsxSheets([{ name: sheetName, rows }], filename);
}

// Excel sheet names can't be empty, over 31 chars, or contain \ / ? * [ ] :
// — sanitize so callers can pass e.g. a year string like "09/2026" straight
// through as a sheet name.
function sanitizeSheetName(name) {
  return String(name).replace(/[\\/?*[\]:]/g, "-").slice(0, 31) || "Sheet";
}

// sheets: [{ name, rows }] — one worksheet per entry, skipping any with no
// rows. Each sheet's columns are derived from its own rows' keys.
export async function downloadXlsxSheets(sheets, filename) {
  const nonEmptySheets = sheets.filter((s) => s.rows.length);
  if (!nonEmptySheets.length) return;

  const workbook = new ExcelJS.Workbook();
  nonEmptySheets.forEach(({ name, rows }) => {
    const sheet = workbook.addWorksheet(sanitizeSheetName(name));
    const headers = Object.keys(rows[0]);
    sheet.columns = headers.map((header) => ({ header, key: header, width: 28 }));
    sheet.getRow(1).font = { bold: true };
    sheet.addRows(rows);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
}

// Client-facing exports of just the Innovation Readiness Level panel (table
// + radar chart) — a lighter version of the admin's exportCompanyXlsx/Pdf in
// adminExport.js, which also bundle the AI Maturity Test.

// Two sheets: the level guide's self-assessment progress, and the official
// year-by-year readiness scores — matching the two panels on the page.
export async function exportReadinessXlsx(companyName, readinessLevels, guideProgress) {
  const guideRows = [];
  READINESS_METRICS.forEach((metric) => {
    const guide = READINESS_LEVEL_GUIDE[metric];
    Object.keys(guide.stages)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((level) => {
        (guide.stages[level].bullets ?? []).forEach((bullet, index) => {
          const status = guideProgress?.[`${metric}:${level}:${index}`];
          if (!status) return;
          guideRows.push({
            metric: READINESS_METRIC_LABELS[metric],
            level,
            bullet,
            status: BULLET_STATUS_LABELS[status],
          });
        });
      });
  });

  const readinessRows = READINESS_METRICS.map((metric) => {
    const row = { metric: READINESS_METRIC_LABELS[metric] };
    READINESS_YEARS.forEach((year) => {
      row[year] = readinessLevels?.[year]?.[metric] ?? 0;
    });
    return row;
  });

  await downloadXlsxSheets(
    [
      { name: "Level guide", rows: guideRows },
      { name: "Current Innovation Readiness Level", rows: readinessRows },
    ],
    `${companyName.replace(/\s+/g, "_")}_readiness.xlsx`,
  );
}

export function exportReadinessPdf(companyName, readinessLevels) {
  const doc = new jsPDF();
  const margin = 14;
  let y = 18;

  doc.setFontSize(16);
  doc.text(`${companyName} — Innovation Readiness Level`, margin, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Metric", ...READINESS_YEARS.map(String)]],
    body: READINESS_METRICS.map((metric) => [
      READINESS_METRIC_LABELS[metric],
      ...READINESS_YEARS.map((year) => readinessLevels?.[year]?.[metric] ?? 0),
    ]),
    theme: "grid",
    styles: { fontSize: 9 },
  });
  y = doc.lastAutoTable.finalY + 10;

  const imgData = renderRadarChartImage(readinessLevels, READINESS_YEARS);
  doc.addImage(imgData, "PNG", margin, y, 90, 90);

  doc.save(`${companyName.replace(/\s+/g, "_")}_readiness.pdf`);
}

// Client-facing exports of the AI Maturity Test — a lighter version of the
// admin's exportCompanyXlsx/Pdf in adminExport.js, which also bundle the
// Innovation Readiness Level.

export async function exportMaturityXlsx(companyName, maturityAnswers) {
  const rows = [];
  maturityDimensions.forEach((dimension) => {
    MATURITY_STAGES.forEach((stage) => {
      const answer = maturityAnswers?.[dimension.id]?.[stage.id];
      rows.push({
        dimension: dimension.title,
        stage: stage.label,
        score: answer ? answer.score : "Not answered",
        comment: answer?.comment || "",
        flagged: answer?.dontUnderstand ? "Yes" : "No",
      });
    });
  });
  await downloadXlsx(
    rows,
    `${companyName.replace(/\s+/g, "_")}_ai_maturity.xlsx`,
    "AI Maturity",
  );
}

export function exportMaturityPdf(companyName, maturityAnswers) {
  const doc = new jsPDF();
  const margin = 14;

  doc.setFontSize(16);
  doc.text(`${companyName} — AI Maturity Test`, margin, 18);

  const body = [];
  maturityDimensions.forEach((dimension) => {
    MATURITY_STAGES.forEach((stage) => {
      const answer = maturityAnswers?.[dimension.id]?.[stage.id];
      body.push([
        dimension.title,
        stage.label,
        answer ? `${answer.score} / 4` : "—",
        answer?.comment || "—",
        answer?.dontUnderstand ? "Yes" : "No",
      ]);
    });
  });

  autoTable(doc, {
    startY: 26,
    margin: { left: margin, right: margin },
    head: [["Dimension", "Stage", "Score", "Comment", "Flagged"]],
    body,
    theme: "grid",
    styles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 34 },
      3: { cellWidth: 55 },
    },
  });

  doc.save(`${companyName.replace(/\s+/g, "_")}_ai_maturity.pdf`);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
