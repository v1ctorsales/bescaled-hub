import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "bescaled_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// Same attributes must be used to set and to clear the cookie.
//
// In production, the frontend (Vercel) and backend (Cloud Run) are on
// different sites, so the cookie needs SameSite=None — which browsers only
// honor when it's also Secure (HTTPS; Cloud Run terminates TLS for us). In
// dev they're both on localhost, and localhost over plain HTTP can't set a
// Secure cookie, so SameSite=Lax + not-Secure is what makes login work there.
function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
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
