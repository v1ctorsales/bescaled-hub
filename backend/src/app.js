import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import companiesRoutes from "./routes/companies.routes.js";
import batchesRoutes from "./routes/batches.routes.js";
import { generalLimiter } from "./middleware/rateLimit.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

export const app = express();

// Cloud Run (and most PaaS hosts) sit behind a reverse proxy: without this,
// every request looks like it comes from the proxy's address, both for
// rate limiting (see middleware/rateLimit.js) and for req.ip in general.
// `1` trusts exactly one hop, which matches Cloud Run's setup.
app.set("trust proxy", 1);

// credentials: true lets the browser send/receive the session cookie cross-origin
// (needs the exact FRONTEND_ORIGIN — a wildcard is not allowed with credentials).
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api", generalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/companies", companiesRoutes);
app.use("/api/batches", batchesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars -- Express only treats a 4-arg function as an error handler
app.use((err, req, res, next) => {
  // Malformed JSON body: the client's fault, and safe to say so.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  // Anything else (Prisma/SQLite included): details stay in the server log,
  // the client only gets a generic message.
  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({ error: "Internal server error" });
});
