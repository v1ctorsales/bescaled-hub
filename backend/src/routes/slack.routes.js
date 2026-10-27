import { Router } from "express";
import * as slackController from "../controllers/slack.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/http.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/channels", asyncHandler(slackController.getChannels));
router.get("/channels/:channelId/messages", asyncHandler(slackController.getMessages));
router.get("/channels/:channelId/replies", asyncHandler(slackController.getReplies));
router.get(
  "/channels/:channelId/files/:fileId",
  asyncHandler(slackController.downloadFile),
);

export default router;
