import { Router } from "express";
import * as readinessLevelController from "../controllers/readinessLevel.controller.js";
import { asyncHandler } from "../utils/http.js";

// Mounted at /api/companies/:id — mergeParams so req.params.id is visible
// here even though :id is declared on the parent router.
const router = Router({ mergeParams: true });

router.get("/readiness-level", asyncHandler(readinessLevelController.getReadinessLevels));
router.patch("/readiness-level", asyncHandler(readinessLevelController.updateReadinessLevel));
router.put("/readiness-level", asyncHandler(readinessLevelController.saveReadiness));
router.get("/readiness-level/filled", asyncHandler(readinessLevelController.isReadinessFormFilled));

router.get("/guide-progress", asyncHandler(readinessLevelController.getGuideProgress));
router.patch("/guide-progress", asyncHandler(readinessLevelController.updateGuideProgress));

export default router;
