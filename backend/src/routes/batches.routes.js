import { Router } from "express";
import * as batchesController from "../controllers/batches.controller.js";
import { asyncHandler } from "../utils/http.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", asyncHandler(batchesController.getBatches));
router.put("/", asyncHandler(batchesController.saveBatches));

export default router;
