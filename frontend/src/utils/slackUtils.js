export function safeFilename(value) {
  return String(value ?? "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .split("")
    .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    .join("")
    .replace(/^\.+/, "")
    .slice(0, 120) || "slack-channel";
}

export function conversationLabel(conversation) {
  if (conversation.type === "im" || conversation.type === "mpim") return conversation.name;
  return `#${conversation.name}`;
}

export function conversationTypeLabel(type) {
  if (type === "im") return "Direct message";
  if (type === "mpim") return "Group DM";
  return "Channel";
}

export function conversationExportName(conversation) {
  const prefix = conversation.type === "im"
    ? "DM"
    : conversation.type === "mpim"
      ? "Group DM"
      : "Channel";
  return safeFilename(`${prefix} - ${conversation.name}`);
}

export function safeUrlHostname(value) {
  if (!value) return "";
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

export function buildConversationGroups(channels) {
  return [
    ["Channels", channels.filter((channel) => channel.type === "channel")],
    ["Direct messages", channels.filter((channel) => channel.type === "im")],
    ["Group DMs", channels.filter((channel) => channel.type === "mpim")],
  ];
}

export function formatTimestamp(timestamp) {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

export function removeLinkedText(text) {
  return String(text ?? "")
    .replace(/<https?:\/\/[^>]+>/g, "")
    .replace(/https?:\/\/[^\s<>]+/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

export function getPreviewType(file) {
  const name = file.name?.toLowerCase() ?? "";
  const mimetype = file.mimetype?.toLowerCase().split(";")[0] ?? "";

  if (mimetype === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype === "video/mp4" || name.endsWith(".mp4")) return "video";
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    || name.endsWith(".pptx")
  ) {
    return "pptx";
  }
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || name.endsWith(".docx")
  ) {
    return "docx";
  }
  return null;
}
