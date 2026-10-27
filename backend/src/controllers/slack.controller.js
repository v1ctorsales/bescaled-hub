import { Readable } from "node:stream";
import * as slackService from "../services/slack.service.js";
import { badRequest } from "../utils/http.js";

export async function getChannels(req, res) {
  res.set("Cache-Control", "private, no-store");
  res.json(await slackService.getChannels());
}

export async function getMessages(req, res) {
  const limit = Number(req.query.limit ?? 50);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return badRequest(res, "limit must be an integer from 1 to 100");
  }
  if (req.query.cursor !== undefined && (typeof req.query.cursor !== "string" || req.query.cursor.length > 2000)) {
    return badRequest(res, "cursor is invalid");
  }

  res.set("Cache-Control", "private, no-store");
  res.json(
    await slackService.getMessages(req.params.channelId, {
      cursor: req.query.cursor,
      limit,
    }),
  );
}

export async function getReplies(req, res) {
  const limit = Number(req.query.limit ?? 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return badRequest(res, "limit must be an integer from 1 to 100");
  }
  if (req.query.cursor !== undefined && (typeof req.query.cursor !== "string" || req.query.cursor.length > 2000)) {
    return badRequest(res, "cursor is invalid");
  }

  res.set("Cache-Control", "private, no-store");
  res.json(
    await slackService.getReplies(req.params.channelId, req.query.ts, {
      cursor: req.query.cursor,
      limit,
    }),
  );
}

export async function downloadFile(req, res, next) {
  const { file, response } = await slackService.downloadFile(
    req.params.channelId,
    req.params.fileId,
  );
  res.set("Cache-Control", "private, no-store");
  res.set("X-Content-Type-Options", "nosniff");
  res.attachment(file.name || file.title || "slack-file");
  res.type(file.mimetype || "application/octet-stream");

  const stream = Readable.fromWeb(response.body);
  stream.on("error", (err) => {
    console.error("Slack file download stream failed:", err);
    if (res.headersSent) res.destroy(err);
    else next(err);
  });
  stream.pipe(res);
}
