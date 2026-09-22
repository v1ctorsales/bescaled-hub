import { Router } from "express";
import * as maturityTestController from "../controllers/maturityTest.controller.js";
import { asyncHandler } from "../utils/http.js";

// Mounted at /api/companies/:id — see readinessLevel.routes.js for why
// mergeParams is needed.
const router = Router({ mergeParams: true });

router.get("/maturity-test", asyncHandler(maturityTestController.getMaturityTest));
router.patch("/maturity-test/answers", asyncHandler(maturityTestController.updateMaturityAnswer));
router.post("/maturity-test/submit", asyncHandler(maturityTestController.submitMaturityTest));

export default router;
