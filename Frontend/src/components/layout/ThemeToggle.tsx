import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { ui } from "@/i18n/translate-enum";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="nav-button theme-toggle"
      aria-label={isDark ? ui.action("switchToLight") : ui.action("switchToDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </button>
  );
}
