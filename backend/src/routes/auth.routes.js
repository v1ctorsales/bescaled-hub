import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.post("/google", asyncHandler(authController.loginWithGoogle));
router.get("/me", authController.getSession);
router.post("/logout", authController.logout);

export default router;
