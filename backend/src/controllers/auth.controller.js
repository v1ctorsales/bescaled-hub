import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db/prismaClient.js";
import { clearSessionCookie, readSession, setSessionCookie } from "../utils/session.js";

let googleClient;
const getGoogleClient = () => (googleClient ??= new OAuth2Client(process.env.GOOGLE_CLIENT_ID));

// Only what the frontend needs — the JWT itself stays in the httpOnly cookie.
const toPublicSession = ({ role, name, email, avatar, companyId }) => ({
  role,
  name,
  email,
  avatar,
  companyId,
});

// POST /api/auth/google — { credential } is the Google ID token from the
// frontend's Google sign-in button.
export async function loginWithGoogle(req, res) {
  const credential = req.body?.credential;
  if (typeof credential !== "string" || !credential) {
    return res.status(400).json({ error: "credential is required" });
  }

  let payload;
  try {
    const ticket = await getGoogleClient().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.warn("Google ID token rejected:", err.message);
    return res.status(401).json({ error: "Invalid Google credential" });
  }
  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ error: "Google account email is not verified" });
  }

  // Stored emails are lowercase (see login-email handling in companies.controller).
  const email = payload.email.toLowerCase();

  let role;
  let companyId = null;
  if (await prisma.adminEmail.findUnique({ where: { email } })) {
    role = "admin";
  } else {
    const loginEmail = await prisma.companyLoginEmail.findFirst({ where: { email } });
    if (!loginEmail) {
      return res.status(403).json({ error: "E-mail não autorizado a acessar o BeScale Hub" });
    }
    role = "company";
    companyId = loginEmail.companyId;
  }

  const session = { email, name: payload.name ?? email, avatar: payload.picture ?? null, role, companyId };
  setSessionCookie(res, session);
  res.json(toPublicSession(session));
}

export function getSession(req, res) {
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });
  res.json(toPublicSession(session));
}

export function logout(req, res) {
  clearSessionCookie(res);
  res.json({ success: true });
}
