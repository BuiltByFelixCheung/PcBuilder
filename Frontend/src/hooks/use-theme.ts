import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function storedTheme(): Theme | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function snapshot(): Theme {
  return storedTheme() ?? systemTheme();
}

function serverSnapshot(): Theme {
  return "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  let query: MediaQueryList | undefined;
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    query = window.matchMedia(DARK_QUERY);
    query.addEventListener("change", listener);
  }
  return () => {
    listeners.delete(listener);
    query?.removeEventListener("change", listener);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

const FAVICON: Record<Theme, string> = {
  light: "/favicon.svg",
  dark: "/favicon-dark.svg",
};

function applyFavicon(theme: Theme) {
  const href = FAVICON[theme];
  const current = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (current?.getAttribute("href") === href) return;

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.setAttribute("href", href);
  if (current) {
    current.replaceWith(link);
  } else {
    document.head.appendChild(link);
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  applyFavicon(theme);
}

export function useTheme() {
  // The server snapshot stays light so prerendered HTML matches the first client render.
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function persistTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next);
    emit();
  }

  return { theme, setTheme: persistTheme };
}
