import rateLimit from "express-rate-limit";

// Requires app.set("trust proxy", ...) in app.js — behind Cloud Run's proxy,
// req.ip is the proxy's address otherwise, and every client would share one
// bucket. The message stays generic; express-rate-limit's default (which we
// override here) doesn't leak internals either, but this keeps the wording
// consistent with the rest of the API's error responses.

// All of /api/*.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Login only — the most sensitive route to brute-force/abuse.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});
