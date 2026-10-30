import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export type Theme = "light" | "dark";

function storedTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function systemTheme(): Theme {
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
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
  current?.replaceWith(link) ?? document.head.appendChild(link);
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  applyFavicon(theme);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => storedTheme() ?? systemTheme(),
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      if (storedTheme() == null) setTheme(systemTheme());
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  function persistTheme(next: Theme) {
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  return { theme, setTheme: persistTheme };
}
