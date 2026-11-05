import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "bescaled_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

// Same attributes must be used to set and to clear the cookie.
//
// Production proxies /api through the frontend origin: Caddy on the VPS or
// Vercel rewrites for Cloud Run. SameSite=Lax works with both configurations
// without third-party cookies. See VPS-DEPLOY.md and docs/CLOUD-DEPLOY.md at
// the repository root. Secure follows NODE_ENV: production requires HTTPS,
// while local development uses plain HTTP.
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
