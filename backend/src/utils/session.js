import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "bescaled_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// Same attributes must be used to set and to clear the cookie.
//
// The browser only ever talks to the frontend's own site (Vercel) — in
// production, frontend/vercel.json rewrites `/api/*` to the Cloud Run
// backend server-side (see backend/README.md — "Proxy (Vercel rewrite)"),
// so as far as the browser can tell, this cookie is being set by the same
// site the page is on. That makes it same-site in every environment, so
// SameSite=Lax always works — no need for SameSite=None (which requires
// Secure, and which some browsers' cross-site tracking protections — Safari
// ITP in particular, though not only there — can silently drop or block in
// ways that were causing intermittent login failures in production before
// this proxy existed). `secure` still follows NODE_ENV: dev runs over plain
// HTTP (localhost), where a Secure cookie can't be set at all.
function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}

export function setSessionCookie(res, session) {
  const token = jwt.sign(session, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: SESSION_TTL_SECONDS,
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_SECONDS * 1000 });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

// Returns { email, name, avatar, role, companyId } or null when the cookie is
// missing, tampered with or expired.
export function readSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { email, name, avatar, role, companyId } = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return { email, name, avatar, role, companyId: companyId ?? null };
  } catch {
    return null;
  }
}
