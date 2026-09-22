import { Router } from "express";
import * as companiesController from "../controllers/companies.controller.js";
import { asyncHandler } from "../utils/http.js";
import { requireAdmin, requireAuth, requireCompanyAccess } from "../middleware/auth.js";
import readinessLevelRoutes from "./readinessLevel.routes.js";
import maturityTestRoutes from "./maturityTest.routes.js";

const router = Router();

// Everything below needs a session. Admins can reach every company; company users
// only their own (requireCompanyAccess).
router.use(requireAuth);

router.get("/", requireAdmin, asyncHandler(companiesController.getCompanies));
// Must come before "/:id" so "current" isn't swallowed as an id.
router.get("/current", asyncHandler(companiesController.getCurrentCompany));
router.post("/", requireAdmin, asyncHandler(companiesController.createCompany));
router.patch("/:id/settings", requireAdmin, asyncHandler(companiesController.updateCompanySettings));
router.delete("/:id", requireAdmin, asyncHandler(companiesController.deleteCompany));
router.get("/:id", requireCompanyAccess, asyncHandler(companiesController.getCompanyById));

router.use("/:id", requireCompanyAccess, readinessLevelRoutes);
router.use("/:id", requireCompanyAccess, maturityTestRoutes);

export default router;
