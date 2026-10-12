import { GEARS } from "@/data/gears";
import { cnGearApiText } from "@/i18n/domain/gearApiTexts";

const zhCNGearNameOverrides = cnGearApiText.gearNamesById as Record<string, string>;

export const gearNamesByLocale = {
  en: Object.fromEntries(GEARS.map((gear) => [gear.id, gear.name])),
  "zh-CN": {
    ...Object.fromEntries(GEARS.map((gear) => [gear.id, gear.name])),
    ...zhCNGearNameOverrides,
  },
} as const;
