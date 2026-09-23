import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/http.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Tighter limit than the general /api one (see middleware/rateLimit.js) —
// this is the route most worth protecting from brute-force/abuse.
router.post("/google", authLimiter, asyncHandler(authController.loginWithGoogle));
router.get("/me", authController.getSession);
router.post("/logout", authController.logout);

export default router;
