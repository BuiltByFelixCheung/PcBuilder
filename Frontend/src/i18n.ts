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

await i18n.use(LanguageDetector).use(initReactI18next).init({
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
    caches: ["localStorage"],
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

export default i18n;
