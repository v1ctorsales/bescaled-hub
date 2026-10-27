const SLACK_API_BASE = "https://slack.com/api";
const CHANNEL_ID_PATTERN = /^[CDG][A-Z0-9]+$/;
const MESSAGE_TS_PATTERN = /^\d{10}\.\d{1,6}$/;
const FILE_ID_PATTERN = /^F[A-Z0-9]+$/;
const SLACKBOT_USER_ID = "D0BTCHES2Q1";
const SLACK_FILE_ORIGIN = "https://files.slack.com";
const USER_NAMES_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedUserNames = new Map();
let userNamesCacheExpiresAt = 0;
let userNamesRequest;

export class SlackIntegrationError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "SlackIntegrationError";
    this.status = status;
  }
}

function getConfiguration() {
  const token = process.env.SLACK_USER_TOKEN;
  if (!token || !token.startsWith("xoxp-")) {
    throw new SlackIntegrationError("Configure SLACK_USER_TOKEN with a Slack user OAuth token", 503);
  }
  return token;
}

async function slackRequest(method, params = {}) {
  const token = getConfiguration();
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
  let response;
  try {
    response = await fetch(`${SLACK_API_BASE}/${method}?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new SlackIntegrationError("Could not connect to Slack. Please try again shortly", 502);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new SlackIntegrationError("Slack returned an invalid response", 502);
  }
  if (!result || typeof result !== "object") {
    throw new SlackIntegrationError("Slack returned an invalid response", 502);
  }

  if (!response.ok || !result.ok) {
    if (response.status === 429 || result.error === "ratelimited") {
      throw new SlackIntegrationError("Slack rate limit reached. Please try again shortly", 429);
    }
    if (result.error === "missing_scope") {
      if (method === "users.list") {
        throw new SlackIntegrationError("The Slack user token is missing the users:read permission scope");
      }
      throw new SlackIntegrationError("The Slack user token is missing a required permission scope", 502);
    }
    if (result.error === "not_in_channel") {
      throw new SlackIntegrationError("The Slack user must be a member of the selected conversation", 502);
    }
    console.error(`Slack API request failed (${method}): ${result.error || response.status}`);
    throw new SlackIntegrationError("Slack request failed. Check the app permissions and channel configuration", 502);
  }

  return result;
}

function validateChannelId(channelId) {
  getConfiguration();
  if (!CHANNEL_ID_PATTERN.test(channelId)) {
    throw new SlackIntegrationError("Channel not found", 404);
  }
}

function extractLinks(message) {
  const links = new Map();
  const addLink = (url, title, description) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const existing = links.get(parsed.href);
        const cleanDescription = typeof description === "string"
          ? description.trim().slice(0, 280)
          : "";
        links.set(parsed.href, {
          url: parsed.href,
          title: title || existing?.title || parsed.hostname,
          description: cleanDescription || existing?.description || null,
        });
      }
    } catch {
      // Ignore malformed link values returned in message content.
    }
  };

  const text = message.text ?? "";
  const slackLinks = /<(https?:\/\/[^>|]+)(?:\|([^>]+))?>/g;
  const plainLinks = /https?:\/\/[^\s<>]+/g;
  for (const match of text.matchAll(slackLinks)) addLink(match[1], match[2]);
  const textWithoutSlackLinks = text.replace(/<https?:\/\/[^>]+>/g, " ");
  for (const match of textWithoutSlackLinks.matchAll(plainLinks)) {
    addLink(match[0].replace(/[),.!?;:]+$/, ""));
  }

  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      if (value.type === "link" && typeof value.url === "string") {
        addLink(value.url, value.text, value.description);
      }
      if (typeof value.title_link === "string") {
        addLink(value.title_link, value.title, value.text || value.description);
      }
      if (typeof value.from_url === "string") {
        addLink(value.from_url, value.title, value.text || value.description);
      }
      Object.values(value).forEach(visit);
    }
  };
  visit(message.blocks);
  visit(message.attachments);

  return [...links.values()];
}

function toApiMessage(message, channelId, userNames) {
  const text = (message.text ?? "").replace(/<@([A-Z0-9]+)(?:\|[^>]*)?>/g, (mention, userId) => {
    const userName = userNames.get(userId);
    return userName ? `@${userName}` : mention;
  });

  return {
    ts: message.ts,
    user: message.user ?? null,
    userName: (message.user && userNames.get(message.user)) || message.username || null,
    text,
    threadTs: message.thread_ts ?? null,
    replyCount: message.reply_count ?? 0,
    links: extractLinks(message),
    files: (message.files ?? [])
      .filter((file) => typeof file.id === "string" && FILE_ID_PATTERN.test(file.id))
      .map((file) => ({
        id: file.id,
        name: file.name ?? file.title ?? "Slack file",
        title: file.title ?? file.name ?? "Slack file",
        mimetype: file.mimetype ?? "application/octet-stream",
        size: file.size ?? null,
        permalink: file.permalink ?? null,
        downloadUrl: `/api/slack/channels/${encodeURIComponent(channelId)}/files/${encodeURIComponent(file.id)}`,
      })),
  };
}

async function getUserNames() {
  if (Date.now() < userNamesCacheExpiresAt) return cachedUserNames;
  if (userNamesRequest) return userNamesRequest;

  userNamesRequest = (async () => {
    const users = [];
    let cursor;
    const seenCursors = new Set();

    do {
      const result = await slackRequest("users.list", { limit: 200, cursor });
      users.push(...result.members);
      cursor = result.response_metadata?.next_cursor || null;
      if (cursor && seenCursors.has(cursor)) {
        throw new SlackIntegrationError("Slack returned an invalid user pagination cursor", 502);
      }
      if (cursor) seenCursors.add(cursor);
    } while (cursor);

    cachedUserNames = new Map(
      users
        .filter((user) => typeof user.id === "string")
        .map((user) => [
          user.id,
          user.profile?.display_name || user.profile?.real_name || user.real_name || user.name || user.id,
        ]),
    );
    userNamesCacheExpiresAt = Date.now() + USER_NAMES_CACHE_TTL_MS;
    return cachedUserNames;
  })();

  try {
    return await userNamesRequest;
  } finally {
    userNamesRequest = null;
  }
}

export async function getChannels() {
  getConfiguration();
  const channels = [];
  let cursor;
  const seenCursors = new Set();

  do {
    const result = await slackRequest("conversations.list", {
      types: "public_channel,private_channel,im,mpim",
      exclude_archived: true,
      limit: 200,
      cursor,
    });
    channels.push(...result.channels);

    cursor = result.response_metadata?.next_cursor || null;
    if (cursor && seenCursors.has(cursor)) {
      throw new SlackIntegrationError("Slack returned an invalid channel pagination cursor", 502);
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  const userNames = channels.some((channel) => channel.is_im)
    ? await getUserNames()
    : new Map();
  const conversations = channels
    .filter((channel) => (
      channel.id !== SLACKBOT_USER_ID
      && !(channel.is_im && channel.user === SLACKBOT_USER_ID)
    ))
    .map((channel) => ({
      id: channel.id,
      name: channel.name
        || (channel.is_im && channel.user
          ? userNames.get(channel.user) || channel.user
          : channel.is_mpim ? "Group DM" : channel.id),
      type: channel.is_im ? "im" : channel.is_mpim ? "mpim" : "channel",
      isPrivate: Boolean(channel.is_private),
      isMember: Boolean(channel.is_im || channel.is_mpim || channel.is_member),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return conversations;
}

export async function getMessages(channelId, { cursor, limit }) {
  validateChannelId(channelId);
  const [result, userNames] = await Promise.all([
    slackRequest("conversations.history", {
      channel: channelId,
      limit,
      cursor,
    }),
    getUserNames(),
  ]);
  return {
    messages: result.messages.map((message) => toApiMessage(message, channelId, userNames)),
    nextCursor: result.response_metadata?.next_cursor || null,
  };
}

export async function getReplies(channelId, threadTs, { cursor, limit }) {
  validateChannelId(channelId);
  if (!MESSAGE_TS_PATTERN.test(threadTs)) {
    throw new SlackIntegrationError("A valid thread timestamp is required", 400);
  }

  const [result, userNames] = await Promise.all([
    slackRequest("conversations.replies", {
      channel: channelId,
      ts: threadTs,
      limit,
      cursor,
    }),
    getUserNames(),
  ]);
  return {
    messages: result.messages.map((message) => toApiMessage(message, channelId, userNames)),
    nextCursor: result.response_metadata?.next_cursor || null,
  };
}

export async function downloadFile(channelId, fileId) {
  validateChannelId(channelId);
  if (!FILE_ID_PATTERN.test(fileId)) {
    throw new SlackIntegrationError("File not found", 404);
  }

  const result = await slackRequest("files.info", { file: fileId });
  const file = result.file;
  const sharedChannelIds = new Set([
    ...(file.channels ?? []),
    ...(file.groups ?? []),
    ...Object.keys(file.shares?.public ?? {}),
    ...Object.keys(file.shares?.private ?? {}),
  ]);
  if (!sharedChannelIds.has(channelId)) {
    throw new SlackIntegrationError("File not found in this channel", 404);
  }

  const downloadUrl = file.url_private_download ?? file.url_private;
  let url;
  try {
    url = new URL(downloadUrl);
  } catch {
    throw new SlackIntegrationError("Slack file has no valid download URL", 502);
  }
  if (url.protocol !== "https:" || url.origin !== SLACK_FILE_ORIGIN) {
    throw new SlackIntegrationError("Slack returned an unsupported file URL", 502);
  }

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${getConfiguration()}` },
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new SlackIntegrationError("Could not download the Slack file", 502);
  }
  if (!response.ok || !response.body) {
    throw new SlackIntegrationError("Slack file download failed", 502);
  }

  return { file, response };
}
