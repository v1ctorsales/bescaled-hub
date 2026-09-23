// __APP_BUILD_TIME__ is a static string inlined at build time by vite.config.js
// — the moment `vite build` (or `vite dev`) started, not when this component
// renders, so the version stays the same for everyone on a given deploy.
const buildDate = new Date(__APP_BUILD_TIME__);

const pad = (n) => String(n).padStart(2, "0");

// "Version 0.1.hh:mm.dd.mm.aaaa", e.g. "Version 0.1.14:32.23.09.2026".
const VERSION_LABEL = `Version 0.1.${pad(buildDate.getHours())}:${pad(buildDate.getMinutes())}.${pad(
  buildDate.getDate(),
)}.${pad(buildDate.getMonth() + 1)}.${buildDate.getFullYear()}`;

export default function VersionBadge() {
  return (
    <div className="version-badge" title={buildDate.toLocaleString()}>
      {VERSION_LABEL}
    </div>
  );
}
