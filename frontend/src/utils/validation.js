// Same rule the backend enforces (backend/src/utils/validation.js), so the form
// can flag a bad email before a request is sent.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value) => value.length <= 254 && EMAIL_RE.test(value);

// Validates the editable company settings. Returns { loginEmailErrors,
// descriptionError, hasErrors }: loginEmailErrors[i] is the message for the
// i-th row (undefined when fine). Empty login-email rows are ignored — they are
// dropped on save.
export function validateCompanySettings({ loginEmails, description }) {
  const seen = new Set();
  const loginEmailErrors = loginEmails.map((raw) => {
    const email = raw.trim().toLowerCase();
    if (!email) return undefined;
    if (!isValidEmail(email)) return "Enter a valid email address.";
    if (seen.has(email)) return "This email is already in the list.";
    seen.add(email);
    return undefined;
  });
  const descriptionError = description.trim() ? undefined : "Description is required.";
  return {
    loginEmailErrors,
    descriptionError,
    hasErrors: Boolean(descriptionError) || loginEmailErrors.some(Boolean),
  };
}

// Months are "MM/YYYY" (e.g. "10/2026") — same rule as the backend. Returns a
// sortable month index (year * 12 + month) or null when it isn't a real month.
export function monthYearToIndex(value) {
  const match = /^(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return year * 12 + month;
}

// Lets people type "102026" and get "10/2026": keeps digits only and inserts the slash.
export function formatMonthYearInput(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

// rows: [{ batch, startDate, endDate }] with "" for unset dates. Returns one
// entry per row ({ startError, endError }, undefined when fine) plus hasErrors.
export function validateBatchDates(rows) {
  const errors = rows.map(({ startDate, endDate }) => {
    const start = startDate ? monthYearToIndex(startDate) : null;
    const end = endDate ? monthYearToIndex(endDate) : null;
    const result = {};
    if (startDate && start === null) result.startError = "Use MM/YYYY.";
    if (endDate && end === null) result.endError = "Use MM/YYYY.";
    if (start !== null && end !== null && end < start) {
      result.endError = "End can't be before start.";
    }
    return result;
  });
  return { errors, hasErrors: errors.some((e) => e.startError || e.endError) };
}
