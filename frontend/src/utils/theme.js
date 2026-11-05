const STORAGE_KEY = "bescaled-theme";
const CHANGE_EVENT = "bescaled-theme-change";

function savedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function initializeTheme() {
  document.documentElement.dataset.theme = savedTheme()
    ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

export function getTheme() {
  return document.documentElement.dataset.theme;
}

export function toggleTheme() {
  const theme = getTheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // The toggle still works for this page when storage is unavailable.
  }
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToTheme(onChange) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (!savedTheme()) {
      initializeTheme();
      onChange();
    }
  };
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      initializeTheme();
      onChange();
    }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  media.addEventListener("change", onSystemChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
    media.removeEventListener("change", onSystemChange);
  };
}
