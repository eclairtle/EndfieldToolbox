import { i18n, type SupportedLocale } from "@/i18n";
import type { ElementType } from "@/data/characters";

export type LocalizableArtsElement = "Heat" | "Cryo" | "Electric" | "Nature";
export type LocalizableCharacterElement = ElementType;

function currentLocale(): SupportedLocale {
  const rawLocale = i18n.global.locale as unknown;
  const value = typeof rawLocale === "string"
    ? rawLocale
    : (rawLocale as { value?: string }).value ?? "en";
  return value === "zh-CN" ? "zh-CN" : "en";
}

const ELEMENT_LABELS_ZH: Record<LocalizableArtsElement, string> = {
  Heat: "灼热",
  Cryo: "寒冷",
  Electric: "电磁",
  Nature: "自然",
};

const CHARACTER_ELEMENT_LABELS_ZH: Record<LocalizableCharacterElement, string> = {
  ...ELEMENT_LABELS_ZH,
  Physical: "物理",
  Aether: "以太",
  Healing: "治疗",
};

export function getLocalizedInflictionElementLabel(element: LocalizableArtsElement): string {
  return currentLocale() === "zh-CN" ? ELEMENT_LABELS_ZH[element] : element;
}

export function getLocalizedCharacterElementLabel(element: LocalizableCharacterElement): string {
  return currentLocale() === "zh-CN" ? CHARACTER_ELEMENT_LABELS_ZH[element] : element;
}
