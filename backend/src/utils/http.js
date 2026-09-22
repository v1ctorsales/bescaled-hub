// Express 4 doesn't catch rejected promises from async handlers — this
// forwards them to the error middleware in app.js instead of leaving the
// request hanging.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(res) {
  return res.status(404).json({ error: "Company not found" });
}

export function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

// Route params that aren't a positive integer can't match a company, so they
// resolve to null and callers answer 404 (same as an unknown id).
export function parseCompanyId(raw) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
