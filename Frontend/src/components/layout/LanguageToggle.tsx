import { useTranslation } from "react-i18next";
import { LANGUAGES, type AppLanguage } from "@/i18n";
import { ui } from "@/i18n/translate-enum";

function selectedLanguage(language: string | undefined): AppLanguage {
  return language?.toLowerCase().startsWith("zh") ? "zh-HK" : "en";
}

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = selectedLanguage(i18n.resolvedLanguage ?? i18n.language);

  return (
    <div className="language-toggle" role="group" aria-label={ui.label("language")}>
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          className={
            current === language.code ? "nav-link active" : "nav-button"
          }
          aria-pressed={current === language.code}
          aria-label={language.label}
          onClick={() => void i18n.changeLanguage(language.code)}
        >
          {language.shortLabel}
        </button>
      ))}
    </div>
  );
}
