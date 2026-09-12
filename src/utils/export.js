import ExcelJS from "exceljs";

// Small helpers to let export buttons actually produce a downloadable file
// instead of being pure placeholders.

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  triggerDownload(blob, filename);
}

export async function downloadXlsx(rows, filename, sheetName = "Sheet1") {
  if (!rows.length) return;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const headers = Object.keys(rows[0]);
  sheet.columns = headers.map((header) => ({ header, key: header, width: 24 }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRows(rows);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, filename);
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
