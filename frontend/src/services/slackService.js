import { API_BASE_URL, apiFetch } from "./apiConfig";

export function getSlackChannels() {
  return apiFetch("/slack/channels");
}

export function getSlackMessages(channelId, { cursor, limit = 50, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch(`/slack/channels/${encodeURIComponent(channelId)}/messages?${params}`, { signal });
}

export function getSlackReplies(channelId, threadTs, { cursor, limit = 100, signal } = {}) {
  const params = new URLSearchParams({ ts: threadTs });
  params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  return apiFetch(`/slack/channels/${encodeURIComponent(channelId)}/replies?${params}`, { signal });
}

export async function getAllChannelMessages(channelId, onProgress) {
  const messages = [];
  const seenCursors = new Set();
  let cursor;

  do {
    const result = await getSlackMessages(channelId, { cursor, limit: 100 });
    messages.push(...result.messages);
    onProgress?.(`Loading channel history… ${messages.length} messages`);
    cursor = result.nextCursor;
    if (cursor && seenCursors.has(cursor)) {
      throw new Error("Slack returned a repeated message pagination cursor");
    }
    if (cursor) seenCursors.add(cursor);
  } while (cursor);

  return messages;
}

export async function getAllThreadReplies(channelId, messages, onProgress) {
  const replies = [];
  const threads = messages.filter((message) => message.replyCount > 0);

  for (const [index, thread] of threads.entries()) {
    let cursor;
    const seenCursors = new Set();
    const seenReplies = new Set([thread.ts]);

    do {
      const result = await getSlackReplies(channelId, thread.ts, { cursor, limit: 100 });
      replies.push(...result.messages.filter((reply) => {
        if (seenReplies.has(reply.ts)) return false;
        seenReplies.add(reply.ts);
        return true;
      }));
      onProgress?.(`Loading replies… ${index + 1} of ${threads.length} threads`);
      cursor = result.nextCursor;
      if (cursor && seenCursors.has(cursor)) {
        throw new Error("Slack returned a repeated reply pagination cursor");
      }
      if (cursor) seenCursors.add(cursor);
    } while (cursor);
  }

  return replies;
}

export async function fetchSlackFile(channelId, fileId, signal) {
  const response = await fetch(
    `${API_BASE_URL}/slack/channels/${encodeURIComponent(channelId)}/files/${encodeURIComponent(fileId)}`,
    { credentials: "include", signal },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `File request failed with status ${response.status}`);
  }
  return response.blob();
}
