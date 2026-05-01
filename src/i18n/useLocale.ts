import { watch } from "vue";
import { useI18n } from "vue-i18n";
import { APP_LOCALE_STORAGE_KEY } from "@/lib/storageKeys";
import type { SupportedLocale } from "@/i18n/index";

export function useLocale() {
  const { t, locale } = useI18n({ useScope: "global" });

  watch(
    locale,
    (value) => {
      if (typeof window === "undefined") {
        return;
      }
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, value);
    },
    { immediate: true },
  );

  function setLocale(next: SupportedLocale) {
    locale.value = next;
  }

  return {
    t,
    locale,
    setLocale,
  };
}
