import { GEARS } from "@/data/gears";
import { cnGearApiText } from "@/i18n/domain/gearApiTexts";

const zhCNGearNameOverrides = cnGearApiText.gearNamesById as Record<string, string>;

const zhCNGearNameManualOverrides: Record<string, string> = {
  item_equip_t4_suit_expend_spell01_body_02: "壤流轻甲",
  item_equip_t4_suit_expend_spell01_edc_02: "壤流短棍",
  item_equip_t4_suit_expend_spell01_hand_02: "壤流护手",
};

export const gearNamesByLocale = {
  en: Object.fromEntries(GEARS.map((gear) => [gear.id, gear.name])),
  "zh-CN": {
    ...Object.fromEntries(GEARS.map((gear) => [gear.id, gear.name])),
    ...zhCNGearNameOverrides,
    ...zhCNGearNameManualOverrides,
  },
} as const;
