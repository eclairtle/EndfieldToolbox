// src/data/gears.ts
import type { AttrKey, CharacterStatKey, ModifierStatKey } from "@/lib/build/stats";
import { NO_SET } from "@/data/gearSets/no_set";
import { AIC_HEAVY, AIC_HEAVY_SET_BONUS } from "@/data/gearSets/aic_heavy";
import { AIC_LIGHT, AIC_LIGHT_SET_BONUS } from "@/data/gearSets/aic_light";
import { ROVING_MSGR, ROVING_MSGR_SET_BONUS } from "@/data/gearSets/roving_msgr";
import { ARMORED_MSGR, ARMORED_MSGR_SET_BONUS } from "@/data/gearSets/armored_msgr";
import { MORDVOLT_RESISTANT, MORDVOLT_RESISTANT_SET_BONUS } from "@/data/gearSets/mordvolt_resistant";
import { MORDVOLT_INSULATION, MORDVOLT_INSULATION_SET_BONUS } from "@/data/gearSets/mordvolt_insulation";
import { ABURREY_S_LEGACY, ABURREY_S_LEGACY_SET_BONUS } from "@/data/gearSets/aburrey_s_legacy";
import { CATASTROPHE, CATASTROPHE_SET_BONUS } from "@/data/gearSets/catastrophe";
import { FRONTIERS, FRONTIERS_SET_BONUS } from "@/data/gearSets/frontiers";
import { TYPE_50_YINGLUNG, TYPE_50_YINGLUNG_SET_BONUS } from "@/data/gearSets/type_50_yinglung";
import { BONEKRUSHA, BONEKRUSHA_SET_BONUS } from "@/data/gearSets/bonekrusha";
import { TIDE_SURGE, TIDE_SURGE_SET_BONUS } from "@/data/gearSets/tide_surge";
import { MI_SECURITY, MI_SECURITY_SET_BONUS } from "@/data/gearSets/mi_security";
import { HOT_WORK, HOT_WORK_SET_BONUS } from "@/data/gearSets/hot_work";
import { LYNX, LYNX_SET_BONUS } from "@/data/gearSets/lynx";
import { SWORDMANCER, SWORDMANCER_SET_BONUS } from "@/data/gearSets/swordmancer";
import { THERTECH, THERTECH_SET_BONUS } from "@/data/gearSets/thertech";
import { PULSER_LABS, PULSER_LABS_SET_BONUS } from "@/data/gearSets/pulser_labs";
import { ETERNAL_XIRANITE, ETERNAL_XIRANITE_SET_BONUS } from "@/data/gearSets/eternal_xiranite";

export type GearSlot = "ARMOR" | "GLOVES" | "KIT";

export type GearSubstatBase = {
  stat: AttrKey | CharacterStatKey | ModifierStatKey;
  value: number; // base lv0 value
};

export type GearBase = {
  id: string;
  name: string;
  slot: GearSlot;
  set?: string;
  upgradable?: boolean;
  defFlat: number;
  subs: GearSubstatBase[];
};

export type GearSetBonus = {
  name: string;
  description: string;
};

export const GEAR_SET_BONUSES: Record<string, GearSetBonus> = {
  "AIC Heavy": AIC_HEAVY_SET_BONUS,
  "AIC Light": AIC_LIGHT_SET_BONUS,
  "Roving MSGR": ROVING_MSGR_SET_BONUS,
  "Armored MSGR": ARMORED_MSGR_SET_BONUS,
  "Mordvolt Resistant": MORDVOLT_RESISTANT_SET_BONUS,
  "Mordvolt Insulation": MORDVOLT_INSULATION_SET_BONUS,
  "Aburrey's Legacy": ABURREY_S_LEGACY_SET_BONUS,
  "Catastrophe": CATASTROPHE_SET_BONUS,
  "Frontiers": FRONTIERS_SET_BONUS,
  "Type 50 Yinglung": TYPE_50_YINGLUNG_SET_BONUS,
  "Bonekrusha": BONEKRUSHA_SET_BONUS,
  "Tide Surge": TIDE_SURGE_SET_BONUS,
  "MI Security": MI_SECURITY_SET_BONUS,
  "Hot Work": HOT_WORK_SET_BONUS,
  "LYNX": LYNX_SET_BONUS,
  "Swordmancer": SWORDMANCER_SET_BONUS,
  "Æthertech": THERTECH_SET_BONUS,
  "Pulser Labs": PULSER_LABS_SET_BONUS,
  "Eternal Xiranite": ETERNAL_XIRANITE_SET_BONUS,
};

export const GEARS: GearBase[] = [
  ...NO_SET,
  ...AIC_HEAVY,
  ...AIC_LIGHT,
  ...ROVING_MSGR,
  ...ARMORED_MSGR,
  ...MORDVOLT_RESISTANT,
  ...MORDVOLT_INSULATION,
  ...ABURREY_S_LEGACY,
  ...CATASTROPHE,
  ...FRONTIERS,
  ...TYPE_50_YINGLUNG,
  ...BONEKRUSHA,
  ...TIDE_SURGE,
  ...MI_SECURITY,
  ...HOT_WORK,
  ...LYNX,
  ...SWORDMANCER,
  ...THERTECH,
  ...PULSER_LABS,
  ...ETERNAL_XIRANITE
];

export function isGearUpgradable(gear: GearBase): boolean {
  if (typeof gear.upgradable === "boolean") {
    return gear.upgradable;
  }

  return gear.id.startsWith("item_equip_t4");
}

export function getEquippedGearSetName(
  gearBases: readonly (GearBase | null | undefined)[],
): string | null {
  const counts = new Map<string, number>();

  for (const gear of gearBases) {
    if (!gear?.set) {
      continue;
    }

    counts.set(gear.set, (counts.get(gear.set) ?? 0) + 1);
  }

  let activeSetName: string | null = null;
  let activeSetCount = 0;

  for (const [setName, count] of counts.entries()) {
    if (count < 3) {
      continue;
    }

    if (count > activeSetCount) {
      activeSetName = setName;
      activeSetCount = count;
    }
  }

  return activeSetName;
}
