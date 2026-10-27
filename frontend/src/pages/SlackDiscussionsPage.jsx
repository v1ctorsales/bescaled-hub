import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import {
  getSlackChannels,
  getSlackMessages,
  getSlackReplies,
} from "../services/slackService";
import SlackMessage from "../components/SlackMessage";
import {
  addChannelExport,
  downloadArchive,
} from "../utils/slackExport";
import {
  buildConversationGroups,
  conversationExportName,
  conversationLabel,
  conversationTypeLabel,
} from "../utils/slackUtils";

function ConversationTypeIcon({ type }) {
  if (type === "channel") {
    return <span className="slack-conversation-icon" aria-hidden="true">#</span>;
  }

  return (
    <svg
      className="slack-conversation-icon"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      {type === "mpim" ? (
        <>
          <circle cx="7" cy="6.5" r="2.5" />
          <circle cx="14" cy="7.5" r="2" />
          <path d="M2.5 16c.3-3 2-4.5 4.5-4.5s4.2 1.5 4.5 4.5M12 12c2.8-.5 4.8 1 5.2 3.5" />
        </>
      ) : (
        <>
          <path d="M3 4.5h14v9H9l-4.5 3v-3H3z" />
          <path d="M6.5 8h7" />
        </>
      )}
    </svg>
  );
}

export default function SlackDiscussionsPage() {
  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [threads, setThreads] = useState({});
  const threadRequests = useRef(new Map());
  const olderMessagesRequest = useRef(null);
  const olderMessagesLoading = useRef(false);
  const channelRequestGeneration = useRef(0);
  const [exporting, setExporting] = useState(false);
  const [exportingScope, setExportingScope] = useState(null);
  const [exportProgress, setExportProgress] = useState(null);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    let active = true;
    getSlackChannels()
      .then((items) => {
        if (!active) return;
        setChannels(items);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoadingChannels(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const generation = ++channelRequestGeneration.current;
    if (!selectedChannelId) {
      setMessages([]);
      setCursor(null);
      setError("");
      setLoadingMessages(false);
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    setLoadingMessages(true);
    setError("");
    setThreads({});

    getSlackMessages(selectedChannelId, { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setMessages(result.messages);
        setCursor(result.nextCursor);
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });

    return () => {
      active = false;
      controller.abort();
      channelRequestGeneration.current += 1;
      olderMessagesRequest.current?.abort();
      olderMessagesRequest.current = null;
      olderMessagesLoading.current = false;
      for (const request of threadRequests.current.values()) request.abort();
      threadRequests.current.clear();
    };
  }, [selectedChannelId]);

  async function loadOlderMessages() {
    if (!cursor || loadingMessages || olderMessagesLoading.current) return;
    const channelId = selectedChannelId;
    const generation = channelRequestGeneration.current;
    const controller = new AbortController();
    olderMessagesRequest.current = controller;
    olderMessagesLoading.current = true;
    setLoadingMessages(true);
    setError("");

    try {
      const result = await getSlackMessages(channelId, { cursor, signal: controller.signal });
      if (channelRequestGeneration.current !== generation) return;
      setMessages((current) => [...current, ...result.messages]);
      setCursor(result.nextCursor);
    } catch (err) {
      if (
        err.name !== "AbortError"
        && channelRequestGeneration.current === generation
      ) {
        setError(err.message);
      }
    } finally {
      if (olderMessagesRequest.current === controller) {
        olderMessagesRequest.current = null;
        olderMessagesLoading.current = false;
        if (channelRequestGeneration.current === generation) setLoadingMessages(false);
      }
    }
  }

  async function toggleThread(message) {
    const channelId = selectedChannelId;
    const generation = channelRequestGeneration.current;
    const requestKey = `${channelId}:${message.ts}`;
    const pendingRequest = threadRequests.current.get(requestKey);

    if (threads[message.ts]) {
      pendingRequest?.abort();
      threadRequests.current.delete(requestKey);
      setThreads((current) => {
        const next = { ...current };
        delete next[message.ts];
        return next;
      });
      return;
    }

    const controller = new AbortController();
    threadRequests.current.set(requestKey, controller);
    setThreads((current) => ({ ...current, [message.ts]: { loading: true } }));
    try {
      const replies = await getSlackReplies(channelId, message.ts, { signal: controller.signal });
      if (
        threadRequests.current.get(requestKey) !== controller
        || channelRequestGeneration.current !== generation
      ) return;
      setThreads((current) => ({
        ...current,
        [message.ts]: { messages: replies.messages },
      }));
    } catch (err) {
      if (
        err.name === "AbortError"
        || threadRequests.current.get(requestKey) !== controller
        || channelRequestGeneration.current !== generation
      ) return;
      setThreads((current) => ({
        ...current,
        [message.ts]: { error: err.message },
      }));
    } finally {
      if (threadRequests.current.get(requestKey) === controller) {
        threadRequests.current.delete(requestKey);
      }
    }
  }

  async function exportChannels(channelsToExport, { scope, includeFolders, filename }) {
    if (channelsToExport.length === 0 || exporting) return;

    setExporting(true);
    setExportingScope(scope);
    setExportError("");
    setExportProgress({
      phase: "channels",
      message: `Preparing ${channelsToExport.length} conversation${channelsToExport.length === 1 ? "" : "s"}…`,
      channelIndex: 0,
      channelCount: channelsToExport.length,
      completedChannels: 0,
    });

    try {
      const JSZip = await import("jszip");
      const zip = new JSZip.default();

      for (const [index, channel] of channelsToExport.entries()) {
        await addChannelExport(
          zip,
          channel,
          index,
          channelsToExport.length,
          setExportProgress,
          includeFolders,
        );
      }

      await downloadArchive(zip, filename, setExportProgress);
      setExportProgress({
        phase: "complete",
        message: `Your export is ready with ${channelsToExport.length} conversation${channelsToExport.length === 1 ? "" : "s"}.`,
        percent: 100,
      });
    } catch (err) {
      setExportError(err.message);
      setExportProgress(null);
    } finally {
      setExporting(false);
      setExportingScope(null);
    }
  }

  function exportAllChannels() {
    const accessibleChannels = channels
      .filter((channel) => channel.isMember)
      .sort((a, b) => a.name.localeCompare(b.name));

    return exportChannels(accessibleChannels, {
      scope: "all",
      includeFolders: true,
      filename: "all-slack-conversations.zip",
    });
  }

  function exportSelectedChannel() {
    if (!selectedChannelId) {
      setExportError("Select a conversation before exporting.");
      return;
    }

    const selectedChannel = channels.find((channel) => channel.id === selectedChannelId);
    if (!selectedChannel) {
      setExportError("Select a conversation before exporting.");
      return;
    }

    if (!selectedChannel.isMember) {
      setExportError("The Slack user must be a member of this conversation before exporting it.");
      return;
    }

    return exportChannels([selectedChannel], {
      scope: "selected",
      includeFolders: false,
      filename: `${conversationExportName(selectedChannel)}-slack-export.zip`,
    });
  }

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId);
  const exportableChannelCount = channels.filter((channel) => channel.isMember).length;
  const channelProgressPercent = exportProgress?.phase === "archive"
    ? exportProgress.percent
    : exportProgress?.phase === "complete"
      ? 100
      : exportProgress?.channelCount
        ? Math.round((exportProgress.completedChannels / exportProgress.channelCount) * 100)
        : 0;
  const conversationGroups = buildConversationGroups(channels);

  return (
    <div className="page">
      <Header subtitle="Admin · Slack" />
      <main className="page__content">
        <Link className="back-link" to="/admin">
          ← Back to admin
        </Link>

        <section className="slack-page__intro">
          <div>
            <h2>Slack discussions</h2>
            <p className="slack-page__description">
              Browse channels and direct messages, then export conversations, replies, and shared files.
            </p>
          </div>

          <div className="summary-cards slack-page__stats" aria-label="Slack conversation overview">
            <div className="summary-card">
              <span className="summary-card__value">{loadingChannels ? "—" : channels.length}</span>
              <span className="summary-card__label">conversations available</span>
            </div>
            <div className="summary-card">
              <span className="summary-card__value">{loadingChannels ? "—" : exportableChannelCount}</span>
              <span className="summary-card__label">conversations ready to export</span>
            </div>
            <div className="summary-card">
              <span className="summary-card__value">{selectedChannelId ? messages.length : "—"}</span>
              <span className="summary-card__label">messages loaded</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__header">
            <div>
              <h2>Conversation explorer</h2>
            </div>
            {selectedChannel && (
              <span className="slack-channel-badge">
                <ConversationTypeIcon type={selectedChannel.type} />
                <span>{conversationTypeLabel(selectedChannel.type)}</span>
                <span className="slack-channel-badge__name">
                  {selectedChannel.type === "channel" ? `#${selectedChannel.name}` : selectedChannel.name}
                </span>
                {selectedChannel.type === "channel" && selectedChannel.isPrivate && (
                  <span className="slack-channel-badge__private">Private</span>
                )}
              </span>
            )}
          </div>

          {loadingChannels ? (
            <p className="loading-state">Loading Slack conversations…</p>
          ) : error && channels.length === 0 ? (
            <p className="slack-error" role="alert">{error}</p>
          ) : channels.length === 0 ? (
            <p className="loading-state">
              No Slack conversations are visible to this user token. Check its permissions and membership.
            </p>
          ) : (
            <>
              <div className="slack-channel-controls">
                <label className="slack-channel-picker">
                  <span>Conversation</span>
                  <select
                    value={selectedChannelId}
                    onChange={(event) => {
                      setSelectedChannelId(event.target.value);
                      setExportError("");
                    }}
                  >
                    <option value="">Select a conversation</option>
                    {conversationGroups.map(([label, conversations]) => conversations.length > 0 && (
                      <optgroup key={label} label={label}>
                        {conversations.map((channel) => (
                          <option key={channel.id} value={channel.id}>
                            {conversationLabel(channel)}
                            {channel.type === "channel" && channel.isPrivate ? " (Private)" : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                <div className="slack-export-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={exportSelectedChannel}
                    disabled={exporting || Boolean(selectedChannel && !selectedChannel.isMember)}
                  >
                    {exportingScope === "selected" ? "Exporting…" : "Export selected conversation"}
                  </button>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={exportAllChannels}
                    disabled={exporting || exportableChannelCount === 0}
                  >
                    {exportingScope === "all" ? "Exporting…" : "Export all conversations"}
                  </button>
                </div>
              </div>

              {selectedChannel && !selectedChannel.isMember && (
                <p className="slack-export-note">
                  The Slack user must be a member of this conversation before exporting it.
                </p>
              )}
              {!selectedChannel && exportableChannelCount === 0 && (
                <p className="slack-export-note">
                  The Slack user must be a member of a conversation before exporting it.
                </p>
              )}

              {exportProgress && (
                <section
                  className={`slack-export-progress${exportProgress.phase === "complete" ? " is-complete" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  <div className="slack-export-progress__header">
                    <div>
                      <strong>{exportProgress.phase === "complete" ? "Export ready" : "Preparing your export"}</strong>
                      <p>{exportProgress.message}</p>
                    </div>
                    <span className="slack-export-progress__value">
                      {exportProgress.phase === "archive"
                        ? `${exportProgress.percent}%`
                        : exportProgress.phase === "complete"
                          ? "100%"
                          : `${exportProgress.completedChannels} / ${exportProgress.channelCount} conversations`}
                    </span>
                  </div>
                  <progress
                    className="slack-export-progress__bar"
                    value={channelProgressPercent}
                    max="100"
                    aria-label={
                      exportProgress.phase === "archive"
                        ? "ZIP archive compression progress"
                        : "Completed conversation exports"
                    }
                  />
                  {exportProgress.phase === "channels" && (
                    <span className="slack-export-progress__detail">
                      {exportProgress.totalFiles !== undefined
                        ? `${exportProgress.downloadedFiles} of ${exportProgress.totalFiles} attachments downloaded`
                        : "Conversations are processed one at a time"}
                    </span>
                  )}
                </section>
              )}

              {exportError && <p className="slack-error" role="alert">{exportError}</p>}
              {error && <p className="slack-error" role="alert">{error}</p>}

              {!selectedChannelId && !error && (
                <p className="loading-state">Select a conversation to load its messages.</p>
              )}
              {loadingMessages && <p className="loading-state">Loading messages…</p>}
              {selectedChannelId && !loadingMessages && !error && messages.length === 0 && (
                <p className="loading-state">No messages found in this conversation.</p>
              )}

              <div className="slack-message-list">
                {messages.map((message) => (
                  <SlackMessage
                    key={`${selectedChannelId}-${message.ts}`}
                    message={message}
                    channelId={selectedChannelId}
                    thread={threads[message.ts]}
                    onToggleThread={toggleThread}
                  />
                ))}
              </div>

              {cursor && (
                <button
                  className="btn-secondary slack-load-more"
                  onClick={loadOlderMessages}
                  disabled={loadingMessages}
                >
                  {loadingMessages ? "Loading…" : "Load older messages"}
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
