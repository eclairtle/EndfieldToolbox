import { createI18n } from "vue-i18n";
import { en, type MessageSchema } from "@/i18n/locales/en";
import { zhCN } from "@/i18n/locales/zh-CN";
import { APP_LOCALE_STORAGE_KEY } from "@/lib/storageKeys";

export type SupportedLocale = "en" | "zh-CN";

function normalizeBrowserLocale(raw: string | null | undefined): SupportedLocale {
  if (!raw) {
    return "en";
  }

  return raw.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

export function getInitialLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return "en";
  }

  const saved = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  if (saved === "en" || saved === "zh-CN") {
    return saved;
  }

  return normalizeBrowserLocale(window.navigator.language);
}

export const i18n = createI18n<[MessageSchema], SupportedLocale>({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages: {
    en,
    "zh-CN": zhCN,
  },
});
