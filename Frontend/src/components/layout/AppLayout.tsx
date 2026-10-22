import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { AppLanguage } from "@/i18n";
import { AppHeader } from "./AppHeader.tsx";
import { MobileHeader } from "./MobileHeader.tsx";
import { Navbar } from "./Navbar.tsx";

export function AppLayout() {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();

  const language = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    const documentLanguage: AppLanguage = language.toLowerCase().startsWith("zh")
      ? "zh-HK"
      : "en";
    document.documentElement.lang = documentLanguage;
    document.title = "PC Builder";
  }, [language]);

  return (
    <>
      {isMobile ? (
        <MobileHeader />
      ) : (
        <>
          <AppHeader />
          <Navbar />
        </>
      )}
      {/* Route pages read i18n at render time. Outlet's element is cached, so a language change has to remount it. */}
      <Outlet key={language} />
    </>
  );
}
