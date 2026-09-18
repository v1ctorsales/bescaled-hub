import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadXlsx, downloadXlsxSheets } from "./export";
import { renderRadarChartImage } from "./radarCanvas";
import { READINESS_METRICS, READINESS_METRIC_LABELS, READINESS_YEARS } from "../config";
import {
  maturityDimensions,
  MATURITY_STAGES,
} from "../data/maturityDimensions";
import {
  READINESS_LEVEL_GUIDE,
  BULLET_STATUS_LABELS,
} from "../data/readinessLevelGuide";

// ---------------------------------------------------------------------------
// Admin exports: an XLSX spreadsheet, and a PDF report that embeds each
// company's radar chart (rendered via src/utils/radarCanvas.js, since jsPDF
// can only place raster/vector images, not live recharts SVGs).
// ---------------------------------------------------------------------------

export function exportCompaniesXlsx(companies) {
  const rows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    contactEmail: c.contactEmail,
    subscribed: c.subscribed,
    filledReadinessForm: c.filledReadinessForm,
    filledMaturityTest: c.filledMaturityTest,
  }));
  downloadXlsx(rows, "bescalehub_companies.xlsx", "Companies");
}

export function exportCompaniesPdf(companies) {
  const doc = new jsPDF();
  const margin = 14;

  doc.setFontSize(16);
  doc.text("BeScaled Hub  — Companies Report", margin, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, 24);
  doc.setTextColor(20);

  companies.forEach((company, index) => {
    if (index > 0) doc.addPage();
    let y = 22;

    doc.setFontSize(14);
    doc.text(company.name, margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(company.contactEmail || "—", margin, y);
    doc.setTextColor(20);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Subscribed", "Readiness Level", "AI Maturity Test"]],
      body: [
        [
          company.subscribed ? "Yes" : "No",
          company.filledReadinessForm ? "Completed" : "Pending",
          company.filledMaturityTest ? "Completed" : "Pending",
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });

    y = doc.lastAutoTable.finalY + 10;

    if (company.filledReadinessForm) {
      const imgData = renderRadarChartImage(
        company.readinessLevels,
        READINESS_YEARS,
      );
      doc.addImage(imgData, "PNG", margin, y, 90, 90);
    } else {
      doc.setFontSize(10);
      doc.text("No Readiness Level data submitted.", margin, y + 4);
    }
  });

  doc.save("bescalehub_companies.pdf");
}

// Every bullet across every metric/level, with its self-assessment status —
// "Not marked" when the company hasn't answered it yet — so the report
// reflects the full checklist, not just what's been filled in.
function getGuideRows(company) {
  const rows = [];
  READINESS_METRICS.forEach((metric) => {
    const guide = READINESS_LEVEL_GUIDE[metric];
    Object.keys(guide.stages)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((level) => {
        (guide.stages[level].bullets ?? []).forEach((bullet, index) => {
          const status = company.guideProgress?.[`${metric}:${level}:${index}`];
          rows.push({
            metric: READINESS_METRIC_LABELS[metric],
            level,
            bullet,
            status: status ? BULLET_STATUS_LABELS[status] : "Not marked",
          });
        });
      });
  });
  return rows;
}

export function exportCompanyXlsx(company) {
  const sheets = [
    {
      name: "Info",
      rows: [
        { field: "Name", value: company.name },
        { field: "Contact email", value: company.contactEmail },
        { field: "Subscribed", value: company.subscribed },
      ],
    },
  ];

  const readinessRows = READINESS_METRICS.map((metric) => {
    const row = { metric: READINESS_METRIC_LABELS[metric] };
    READINESS_YEARS.forEach((year) => {
      row[year] = company.readinessLevels?.[year]?.[metric] ?? 0;
    });
    return row;
  });
  sheets.push({ name: "KTH", rows: readinessRows });

  sheets.push({ name: "KTH Level Guide", rows: getGuideRows(company) });

  const maturityRows = [];
  maturityDimensions.forEach((dimension) => {
    MATURITY_STAGES.forEach((stage) => {
      const answer = company.maturityAnswers?.[dimension.id]?.[stage.id];
      maturityRows.push({
        dimension: dimension.title,
        stage: stage.label,
        score: answer ? answer.score : "Not answered",
        comment: answer?.comment || "",
        flagged: answer?.dontUnderstand ? "Yes" : "No",
      });
    });
  });
  sheets.push({ name: "AI Maturity", rows: maturityRows });

  downloadXlsxSheets(sheets, `${company.name.replace(/\s+/g, "_")}.xlsx`);
}

export function exportCompanyPdf(company) {
  const doc = new jsPDF();
  const margin = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  doc.setFontSize(16);
  doc.text(company.name, margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(company.contactEmail || "—", margin, y);
  doc.setTextColor(20);
  y += 10;

  doc.setFontSize(12);
  doc.text("Innovation Readiness Level", margin, y);
  y += 4;

  if (company.filledReadinessForm) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Metric", ...READINESS_YEARS.map(String)]],
      body: READINESS_METRICS.map((metric) => [
        metric,
        ...READINESS_YEARS.map(
          (year) => company.readinessLevels?.[year]?.[metric] ?? 0,
        ),
      ]),
      theme: "grid",
      styles: { fontSize: 9 },
    });
    y = doc.lastAutoTable.finalY + 8;

    if (y + 90 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    const imgData = renderRadarChartImage(
      company.readinessLevels,
      READINESS_YEARS,
    );
    doc.addImage(imgData, "PNG", margin, y, 90, 90);
    y += 98;
  } else {
    doc.setFontSize(10);
    doc.text("No Readiness Level data submitted.", margin, y + 4);
    y += 16;
  }

  doc.addPage();
  y = margin;

  doc.setFontSize(12);
  doc.text("KTH Level Guide", margin, y);
  y += 4;

  const guideRows = getGuideRows(company);
  if (guideRows.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Metric", "Level", "Requirement", "Status"]],
      body: guideRows.map((row) => [row.metric, row.level, row.bullet, row.status]),
      theme: "grid",
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 14 },
        2: { cellWidth: 105 },
        3: { cellWidth: 25 },
      },
    });
  } else {
    doc.setFontSize(10);
    doc.text("No level guide progress submitted.", margin, y + 4);
  }

  doc.addPage();
  y = margin;

  doc.setFontSize(12);
  doc.text("AI Maturity Test", margin, y);
  y += 4;

  if (company.filledMaturityTest) {
    const body = [];
    maturityDimensions.forEach((dimension) => {
      MATURITY_STAGES.forEach((stage) => {
        const answer = company.maturityAnswers?.[dimension.id]?.[stage.id];
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
      startY: y,
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
  } else {
    doc.setFontSize(10);
    doc.text("No AI Maturity Test submitted.", margin, y + 4);
  }

  doc.save(`${company.name.replace(/\s+/g, "_")}.pdf`);
}
