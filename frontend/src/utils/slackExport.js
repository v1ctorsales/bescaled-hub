import {
  fetchSlackFile,
  getAllChannelMessages,
  getAllThreadReplies,
} from "../services/slackService";
import {
  conversationExportName,
  conversationLabel,
  formatTimestamp,
  getPreviewType,
  removeLinkedText,
  safeFilename,
  safeUrlHostname,
} from "./slackUtils";

async function createImagePreview(blob) {
  if (!blob || blob.size > 20 * 1024 * 1024 || typeof createImageBitmap !== "function") return null;
  const bitmap = await createImageBitmap(blob);
  return createBitmapPreview(bitmap);
}

function createBitmapPreview(bitmap) {
  const maxDimension = 520;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    return null;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return {
    data: canvas.toDataURL("image/jpeg", 0.78),
    width: canvas.width,
    height: canvas.height,
  };
}

async function createPdfPreview(blob) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const pdfDocument = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;

  try {
    const page = await pdfDocument.getPage(1);
    const initialViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1, 520 / Math.max(initialViewport.width, initialViewport.height));
    const viewport = page.getViewport({ scale });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Could not render the PDF preview");

    await page.render({ canvasContext: context, viewport }).promise;
    return {
      data: canvas.toDataURL("image/jpeg", 0.82),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    await pdfDocument.destroy();
  }
}

async function createPptxPreview(blob) {
  const [{ PptxViewer, RECOMMENDED_ZIP_LIMITS }, { default: html2canvas }] = await Promise.all([
    import("@aiden0z/pptx-renderer/browser"),
    import("html2canvas"),
  ]);

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:0;top:0;width:520px;z-index:-1;background:#fff;";
  document.body.append(container);

  let viewer;
  let thumbnail;

  try {
    viewer = await PptxViewer.open(await blob.arrayBuffer(), container, {
      zipLimits: RECOMMENDED_ZIP_LIMITS,
      lazySlides: true,
      lazyMedia: true,
      renderMode: "slide",
    });

    const thumbnailContainer = document.createElement("div");
    container.append(thumbnailContainer);
    thumbnail = viewer.renderThumbnailToContainer(0, thumbnailContainer, { width: 520 });

    if (!thumbnail) return null;
    await thumbnail.ready;

    const canvas = await html2canvas(thumbnailContainer, {
      backgroundColor: "#ffffff",
      scale: 1,
      useCORS: false,
      logging: false,
    });

    return {
      data: canvas.toDataURL("image/jpeg", 0.82),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    thumbnail?.dispose();
    viewer?.destroy();
    container.remove();
  }
}

async function createVideoPreview(blob) {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
  video.muted = true;
  video.preload = "auto";
  video.playsInline = true;
  video.src = url;
  document.body.append(video);

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Video preview timed out")), 10_000);
      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener("loadeddata", handleLoaded);
        video.removeEventListener("error", handleError);
      };
      const handleLoaded = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error("Could not decode video preview"));
      };
      video.addEventListener("loadeddata", handleLoaded, { once: true });
      video.addEventListener("error", handleError, { once: true });
      video.load();
    });

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 520 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Could not render the video preview");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return {
      data: canvas.toDataURL("image/jpeg", 0.82),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    video.remove();
    URL.revokeObjectURL(url);
  }
}

export async function createAttachmentPreview(file, blob) {
  const type = getPreviewType(file);
  if (type === "image") return createImagePreview(blob);
  if (type === "pdf") return createPdfPreview(blob);
  if (type === "pptx") return createPptxPreview(blob);
  if (type === "video") return createVideoPreview(blob);
  return null;
}

export async function createDiscussionPdf(conversationName, messages, rootMessageTimestamps, attachmentBlobs) {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const root = document.createElement("div");
  root.className = "slack-export-render-root";
  root.style.opacity = "0";
  root.style.position = "fixed";
  root.style.top = "0";
  root.style.left = "0";
  root.style.width = "760px";
  root.style.zIndex = "-1";
  root.id = `slack-export-${Date.now()}`;

  const panel = document.createElement("section");
  panel.className = "panel";
  const header = document.createElement("div");
  header.className = "panel__header";
  const heading = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = `${conversationName} discussions`;
  const subtitle = document.createElement("p");
  subtitle.className = "slack-page__description";
  subtitle.textContent = `${messages.length} messages and replies · Exported ${new Date().toLocaleString()}`;
  heading.append(title, subtitle);
  header.append(heading);
  panel.append(header);

  const messageList = document.createElement("div");
  messageList.className = "slack-message-list";

  for (const message of messages) {
    const isReply = message.threadTs || !rootMessageTimestamps.has(message.ts);
    const article = document.createElement("article");
    article.className = "slack-message";

    const metadata = document.createElement("div");
    metadata.className = "slack-message__meta";
    const author = document.createElement("strong");
    author.textContent = `${isReply ? "↳ " : ""}${message.userName || message.user || "Slack user"}`;
    const timestamp = document.createElement("time");
    timestamp.dateTime = new Date(Number(message.ts) * 1000).toISOString();
    timestamp.textContent = formatTimestamp(message.ts);
    metadata.append(author, timestamp);
    article.append(metadata);

    const text = removeLinkedText(message.text || "");
    if (text || !message.links?.length) {
      const body = document.createElement("p");
      body.className = "slack-message__text";
      body.textContent = text || "(No text content)";
      article.append(body);
    }

    if (message.links?.length) {
      const links = document.createElement("ul");
      links.className = "slack-link-previews";
      links.setAttribute("aria-label", "Link previews");

      for (const link of message.links) {
        const item = document.createElement("li");
        item.className = "slack-link-preview";
        const linkTitle = document.createElement("a");
        const host = safeUrlHostname(link.url);
        linkTitle.className = "slack-link-preview__title";
        linkTitle.href = link.url;
        linkTitle.target = "_blank";
        linkTitle.rel = "noopener noreferrer";
        linkTitle.textContent = link.title || host || "Link";

        const hostElement = document.createElement("span");
        hostElement.className = "slack-link-preview__host";
        hostElement.textContent = host || "link";
        item.append(linkTitle, hostElement);

        if (link.description) {
          const description = document.createElement("p");
          description.className = "slack-link-preview__description";
          description.textContent = link.description;
          item.append(description);
        }

        links.append(item);
      }

      article.append(links);
    }

    if (message.files?.length) {
      const files = document.createElement("ul");
      files.className = "slack-message__assets";
      files.setAttribute("aria-label", "Files shared in message");

      for (const file of message.files) {
        const item = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = `${file.title || file.name || "Slack file"}${file.size ? ` (${(file.size / 1024 / 1024).toFixed(1)} MB)` : ""}`;
        item.append(name);

        const previewType = getPreviewType(file);
        if (previewType) {
          const blob = attachmentBlobs.get(file.id);
          try {
            const preview = await createAttachmentPreview(file, blob);
            if (preview) {
              const image = document.createElement("img");
              image.className = "slack-file-preview__media slack-export-attachment-preview";
              image.alt = `Preview of ${file.name || file.title || "attachment"}`;
              image.src = preview.data;
              item.append(image);
            } else {
              const details = document.createElement("span");
              details.textContent = "Preview unavailable; file included in ZIP.";
              item.append(details);
            }
          } catch {
            const details = document.createElement("span");
            details.textContent = "Preview unavailable; file included in ZIP.";
            item.append(details);
          }
        }

        files.append(item);
      }

      article.append(files);
    }

    messageList.append(article);
  }

  panel.append(messageList);
  root.append(panel);
  document.body.append(root);

  try {
    await document.fonts?.ready;
    const capture = async (element) => html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 1.5,
      useCORS: false,
      logging: false,
      onclone: (clonedDocument) => {
        const clonedRoot = clonedDocument.getElementById(root.id);
        if (clonedRoot) clonedRoot.style.opacity = "1";
      },
    });

    const margin = 14;
    const imageWidth = 182;
    const pageContentHeight = 269;
    let y = margin;

    const addCapturedElement = async (element) => {
      const canvas = await capture(element);
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const scale = Math.min(imageWidth / canvas.width, pageContentHeight / (canvas.height * imageWidth / canvas.width));
      const width = canvas.width * scale;
      const height = canvas.height * scale;

      if (y + height > 283) {
        pdf.addPage();
        y = margin;
      }

      const x = (210 - width) / 2;
      pdf.addImage(image, "JPEG", x, y, width, height);

      const elementRect = element.getBoundingClientRect();
      const pixelToMm = width / elementRect.width;
      for (const link of element.querySelectorAll(".slack-link-preview__title")) {
        const rect = link.getBoundingClientRect();
        pdf.link(
          x + (rect.left - elementRect.left) * pixelToMm,
          y + (rect.top - elementRect.top) * pixelToMm,
          rect.width * pixelToMm,
          rect.height * pixelToMm,
          { url: link.href },
        );
      }
      y += height + 3;
    };

    await addCapturedElement(header);
    for (const article of messageList.children) {
      await addCapturedElement(article);
    }
    return pdf.output("blob");
  } finally {
    root.remove();
  }
}

export async function addChannelExport(zip, channel, channelIndex, channelCount, onProgress, includeFolder) {
  const prefix = includeFolder ? `${conversationExportName(channel)}/` : "";
  const reportProgress = (status, details = {}) => {
    onProgress({
      phase: "channels",
      message: `${conversationLabel(channel)}: ${status}`,
      channelIndex,
      channelCount,
      completedChannels: channelIndex,
      ...details,
    });
  };

  try {
    const messages = await getAllChannelMessages(channel.id, reportProgress);
    const replies = await getAllThreadReplies(channel.id, messages, reportProgress);
    const allMessages = [...messages, ...replies].sort((a, b) => Number(a.ts) - Number(b.ts));
    const rootMessageTimestamps = new Set(messages.map((message) => message.ts));
    const attachmentBlobs = new Map();
    const fileMap = new Map();

    for (const message of allMessages) {
      for (const file of message.files || []) {
        if (!fileMap.has(file.id)) fileMap.set(file.id, file);
      }
    }

    let downloaded = 0;
    const usedFilenames = new Set();
    for (const file of fileMap.values()) {
      reportProgress(`Downloading attachments… ${downloaded} of ${fileMap.size}`, {
        downloadedFiles: downloaded,
        totalFiles: fileMap.size,
      });

      const blob = await fetchSlackFile(channel.id, file.id);
      attachmentBlobs.set(file.id, blob);

      const originalFilename = safeFilename(file.name || file.title || "slack-file");
      const extensionIndex = originalFilename.lastIndexOf(".");
      const hasExtension = extensionIndex > 0;
      const baseName = hasExtension ? originalFilename.slice(0, extensionIndex) : originalFilename;
      const extension = hasExtension ? originalFilename.slice(extensionIndex) : "";
      let filename = originalFilename;
      let suffix = 2;

      while (usedFilenames.has(filename.toLowerCase())) {
        filename = `${baseName} (${suffix})${extension}`;
        suffix += 1;
      }

      usedFilenames.add(filename.toLowerCase());
      zip.file(`${prefix}files/${filename}`, blob);
      downloaded += 1;
    }

    reportProgress("Creating discussion transcript…");
    const transcript = await createDiscussionPdf(
      conversationLabel(channel),
      allMessages,
      rootMessageTimestamps,
      attachmentBlobs,
    );

    zip.file(`${prefix}${safeFilename(channel.name)}-discussions.pdf`, transcript);
    onProgress({
      phase: "channels",
      message: `${conversationLabel(channel)} export ready`,
      channelIndex,
      channelCount,
      completedChannels: channelIndex + 1,
    });
  } catch (err) {
    throw new Error(`Could not export ${conversationLabel(channel)}: ${err.message}`, { cause: err });
  }
}

export async function downloadArchive(zip, filename, onProgress) {
  onProgress({ phase: "archive", message: "Compressing the ZIP archive…", percent: 0 });
  const archive = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    },
    ({ percent }) => onProgress({
      phase: "archive",
      message: "Compressing the ZIP archive…",
      percent: Math.round(percent),
    }),
  );

  const objectUrl = URL.createObjectURL(archive);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
