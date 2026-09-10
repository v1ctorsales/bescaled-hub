import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadCsv } from "./export";
import { renderRadarChartImage } from "./radarCanvas";
import { READINESS_METRICS, READINESS_YEARS } from "../config";
import {
  maturityDimensions,
  MATURITY_STAGES,
} from "../data/maturityDimensions";

// ---------------------------------------------------------------------------
// Admin exports: a flat CSV for spreadsheets, and a PDF report that embeds
// each company's radar chart (rendered via src/utils/radarCanvas.js, since
// jsPDF can only place raster/vector images, not live recharts SVGs).
// ---------------------------------------------------------------------------

export function exportCompaniesCsv(companies) {
  const rows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    contactEmail: c.contactEmail,
    subscribed: c.subscribed,
    filledReadinessForm: c.filledReadinessForm,
    filledMaturityTest: c.filledMaturityTest,
  }));
  downloadCsv(rows, "bescalehub_companies.csv");
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

export function exportCompanyCsv(company) {
  const rows = [
    { section: "info", key: "name", value: company.name },
    { section: "info", key: "contactEmail", value: company.contactEmail },
    { section: "info", key: "subscribed", value: company.subscribed },
  ];

  READINESS_YEARS.forEach((year) => {
    READINESS_METRICS.forEach((metric) => {
      rows.push({
        section: `readiness_${year}`,
        key: metric,
        value: company.readinessLevels?.[year]?.[metric] ?? 0,
      });
    });
  });

  maturityDimensions.forEach((dimension) => {
    MATURITY_STAGES.forEach((stage) => {
      const answer = company.maturityAnswers?.[dimension.id]?.[stage.id];
      const key = `${dimension.title} — ${stage.label}`;
      rows.push({
        section: "maturity",
        key,
        value: answer ? `${answer.score} / 4` : "Not answered",
      });
      if (answer?.comment) {
        rows.push({ section: "maturity_comment", key, value: answer.comment });
      }
      if (answer?.dontUnderstand) {
        rows.push({
          section: "maturity_flag",
          key,
          value: "Flagged as unclear",
        });
      }
    });
  });

  downloadCsv(rows, `${company.name.replace(/\s+/g, "_")}.csv`);
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

  if (y > pageHeight - 40) {
    doc.addPage();
    y = margin;
  }

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
