import { createI18n } from "vue-i18n";
import en from "./messages/en";
import zhTw from "./messages/zh_tw";
import { loadLocale, saveLocale } from "../services/print_storage";

export const SUPPORTED_LOCALES = ["zh-TW", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isSupportedLocale(value: string | null): value is SupportedLocale {
  return value === "zh-TW" || value === "en";
}

function getBrowserLocale(): SupportedLocale {
  const browserLocales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  return browserLocales.some((locale) => locale.toLowerCase().startsWith("zh"))
    ? "zh-TW"
    : "en";
}

const initialLocale = (() => {
  const savedLocale = loadLocale();
  return isSupportedLocale(savedLocale) ? savedLocale : getBrowserLocale();
})();

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: "en",
  messages: {
    "zh-TW": zhTw,
    en,
  },
});

export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
  saveLocale(locale);
}

document.documentElement.lang = initialLocale;
