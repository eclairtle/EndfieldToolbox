import type { WeaponType } from "@/data/weapons";
import { i18n, type SupportedLocale } from "@/i18n";

function currentLocale(): SupportedLocale {
  const rawLocale = i18n.global.locale as unknown;
  const value = typeof rawLocale === "string"
    ? rawLocale
    : (rawLocale as { value?: string }).value ?? "en";
  return value === "zh-CN" ? "zh-CN" : "en";
}

const WEAPON_TYPE_LABELS: Record<SupportedLocale, Record<WeaponType, string>> = {
  en: {
    SWORD: "Sword",
    GREATSWORD: "Greatsword",
    POLEARM: "Polearm",
    HANDCANNON: "Handcannon",
    ARTS_UNIT: "Arts Unit",
  },
  "zh-CN": {
    SWORD: "单手剑",
    GREATSWORD: "双手剑",
    POLEARM: "长柄武器",
    HANDCANNON: "手铳",
    ARTS_UNIT: "施术单元",
  },
};

export function getLocalizedWeaponTypeLabel(weaponType: WeaponType): string {
  return WEAPON_TYPE_LABELS[currentLocale()][weaponType];
}
