import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { AppLanguage } from "@/i18n";
import { ui } from "@/i18n/translate-enum";
import { applyPageMeta } from "@/seo/page-meta";
import { isNoIndexPath } from "@/seo/private-paths";
import { AppHeader } from "./AppHeader.tsx";
import { MobileHeader } from "./MobileHeader.tsx";
import { Navbar } from "./Navbar.tsx";

export function AppLayout() {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const { pathname } = useLocation();
  const noindex = isNoIndexPath(pathname);

  const language = i18n.resolvedLanguage ?? i18n.language;

  useEffect(() => {
    const documentLanguage: AppLanguage = language.toLowerCase().startsWith("zh")
      ? "zh-HK"
      : "en";
    document.documentElement.lang = documentLanguage;
  }, [language]);

  useEffect(() => {
    if (!noindex) return;
    applyPageMeta({
      title: ui.seo("homeTitle"),
      description: ui.seo("homeDescription"),
      canonicalPath: pathname,
      robots: "noindex,nofollow",
    });
  }, [noindex, pathname, language]);

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
