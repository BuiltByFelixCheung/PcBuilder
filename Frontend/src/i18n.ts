import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/i18n/locales/en.json";
import zhHK from "@/i18n/locales/zh-HK.json";

export const LANGUAGES = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "zh-HK", label: "繁體中文", shortLabel: "繁" },
] as const;

export type AppLanguage = (typeof LANGUAGES)[number]["code"];

export function detectedAppLanguage(): AppLanguage | undefined {
  const detector = i18n.services.languageDetector as
    { detect?: () => unknown } | undefined;
  const detected = detector?.detect?.();
  const raw = Array.isArray(detected) ? detected[0] : detected;
  if (typeof raw !== "string") return undefined;
  const lower = raw.toLowerCase();
  if (lower.startsWith("zh")) return "zh-HK";
  if (lower.startsWith("en")) return "en";
  return undefined;
}

// Prerender and the first browser paint both use zh-HK. The detector runs after
// mount so a stored or browser language cannot disagree with the HTML.
// Caches stay empty through init: i18next persists the explicit lng immediately,
// which would replace a stored preference before that detection runs.
const languageCaches: string[] = [];

if (typeof window !== "undefined") {
  i18n.use(LanguageDetector);
}

await i18n.use(initReactI18next).init({
  lng: "zh-HK",
  resources: {
    en: { common: en },
    "zh-HK": { common: zhHK },
  },
  supportedLngs: ["en", "zh-HK"],
  load: "currentOnly",
  fallbackLng: {
    "en-US": ["en"],
    "en-GB": ["en"],
    "zh-TW": ["zh-HK"],
    "zh-CN": ["zh-HK"],
    zh: ["zh-HK"],
    default: ["zh-HK"],
  },
  detection: {
    order: ["localStorage", "querystring", "navigator"],
    caches: languageCaches,
    lookupQuerystring: "lng",
  },
  ns: ["common"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  debug: import.meta.env.DEV && import.meta.env.MODE !== "test",
});

if (typeof window !== "undefined") {
  languageCaches.push("localStorage");
}

export default i18n;
