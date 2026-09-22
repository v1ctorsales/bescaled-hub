import { readSession } from "../utils/session.js";
import { parseCompanyId } from "../utils/http.js";

export function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });
  req.session = session;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.session.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
}

// For routes with a :id company param: admins can reach any company, company
// users only their own.
export function requireCompanyAccess(req, res, next) {
  const { role, companyId } = req.session;
  if (role === "admin" || (role === "company" && companyId === parseCompanyId(req.params.id))) {
    return next();
  }
  return res.status(403).json({ error: "Forbidden" });
}
