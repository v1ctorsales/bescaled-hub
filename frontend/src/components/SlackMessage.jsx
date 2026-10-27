import { useEffect, useRef, useState } from "react";
import { fetchSlackFile } from "../services/slackService";
import {
  formatTimestamp,
  getPreviewType,
  removeLinkedText,
  safeUrlHostname,
} from "../utils/slackUtils";

function SlackFilePreview({ channelId, file, type }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const slidesContainer = useRef(null);
  const docxContainer = useRef(null);
  const docxStylesContainer = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let objectUrl;
    let viewer;
    let docxTarget;
    let docxStylesTarget;

    async function loadPreview() {
      setLoading(true);
      setError("");

      try {
        const blob = await fetchSlackFile(channelId, file.id, controller.signal);
        if (!active) return;

        if (type === "pdf" || type === "image" || type === "video") {
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
          return;
        }

        if (type === "docx") {
          const { renderAsync } = await import("docx-preview");
          if (!active || !docxContainer.current || !docxStylesContainer.current) return;
          docxTarget = docxContainer.current;
          docxStylesTarget = docxStylesContainer.current;
          await renderAsync(
            blob,
            docxTarget,
            docxStylesTarget,
            {
              className: "slack-docx",
              ignoreWidth: true,
              ignoreHeight: true,
              breakPages: false,
              renderAltChunks: false,
              useBase64URL: true,
            },
          );
          if (!active) {
            docxTarget.replaceChildren();
            docxStylesTarget.replaceChildren();
          }
          return;
        }

        const { PptxViewer, RECOMMENDED_ZIP_LIMITS } = await import("@aiden0z/pptx-renderer/browser");
        if (!active || !slidesContainer.current) return;
        viewer = await PptxViewer.open(
          await blob.arrayBuffer(),
          slidesContainer.current,
          {
            zipLimits: RECOMMENDED_ZIP_LIMITS,
            lazySlides: true,
            lazyMedia: true,
            listOptions: { windowed: true, initialSlides: 4, batchSize: 4 },
            signal: controller.signal,
          },
        );
        if (!active) viewer.destroy();
      } catch (err) {
        if (active && err.name !== "AbortError") setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPreview();
    return () => {
      active = false;
      controller.abort();
      viewer?.destroy();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPreviewUrl("");
      docxTarget?.replaceChildren();
      docxStylesTarget?.replaceChildren();
    };
  }, [channelId, file.id, type]);

  return (
    <div className="slack-file-preview slack-file-preview__content">
      {loading && <p className="loading-state">Loading preview…</p>}
      {error && <p className="slack-error" role="alert">{error}</p>}
      {type === "pdf" && previewUrl && (
        <iframe
          className="slack-file-preview__pdf"
          src={previewUrl}
          title={`Preview of ${file.name || file.title}`}
        />
      )}
      {type === "image" && previewUrl && (
        <img
          className="slack-file-preview__media"
          src={previewUrl}
          alt={file.name || file.title}
        />
      )}
      {type === "video" && previewUrl && (
        <video
          className="slack-file-preview__media"
          src={previewUrl}
          controls
          preload="metadata"
          playsInline
        >
          Your browser does not support MP4 video playback.
        </video>
      )}
      {type === "pptx" && <div ref={slidesContainer} className="slack-file-preview__slides" />}
      {type === "docx" && (
        <>
          <div ref={docxStylesContainer} className="slack-file-preview__docx-styles" />
          <div
            ref={docxContainer}
            className="slack-file-preview__docx"
            aria-label={`Preview of ${file.name || file.title}`}
          />
        </>
      )}
    </div>
  );
}

function renderSlackText(text) {
  const cleanedText = removeLinkedText(text);
  if (!cleanedText) return "";

  return cleanedText.split(/(\*[^*\n]+\*)/g).map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }
    return part;
  });
}

export default function SlackMessage({ message, channelId, thread, onToggleThread }) {
  return (
    <article className="slack-message">
      <div className="slack-message__meta">
        <strong>{message.userName || message.user || "Slack user"}</strong>
        <time dateTime={new Date(Number(message.ts) * 1000).toISOString()}>
          {formatTimestamp(message.ts)}
        </time>
      </div>
      <p className="slack-message__text">
        {renderSlackText(message.text || "") || (!message.links?.length && "(No text content)")}
      </p>
      {message.links?.length > 0 && (
        <ul className="slack-link-previews" aria-label="Link previews">
          {message.links.map((link) => (
            <li className="slack-link-preview" key={link.url}>
              <a
                className="slack-link-preview__title"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.title}
              </a>
              <span className="slack-link-preview__host">{safeUrlHostname(link.url) || "link"}</span>
              {link.description && (
                <p className="slack-link-preview__description">{link.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {message.files?.length > 0 && (
        <ul className="slack-message__assets" aria-label="Files shared in message">
          {message.files.map((file) => {
            const previewType = getPreviewType(file);
            return (
              <li key={file.id}>
                <span>
                  {file.title || file.name}
                  {file.size ? ` (${(file.size / 1024 / 1024).toFixed(1)} MB)` : ""}
                </span>
                {previewType && (
                  <SlackFilePreview
                    channelId={channelId}
                    file={file}
                    type={previewType}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {message.replyCount > 0 && (
        <button
          className="btn-link slack-message__thread-button"
          onClick={() => onToggleThread?.(message)}
          aria-expanded={Boolean(thread)}
        >
          {thread ? "Hide" : "View"} {message.replyCount}{" "}
          {message.replyCount === 1 ? "reply" : "replies"}
        </button>
      )}
      {thread?.loading && <p className="loading-state">Loading replies…</p>}
      {thread?.error && <p className="slack-error">{thread.error}</p>}
      {thread?.messages && (
        <div className="slack-message__replies">
          {thread.messages
            .filter((reply) => reply.ts !== message.ts)
            .map((reply) => (
              <SlackMessage
                key={`${channelId}-${reply.ts}`}
                message={reply}
                channelId={channelId}
                onToggleThread={onToggleThread}
              />
            ))}
        </div>
      )}
    </article>
  );
}
