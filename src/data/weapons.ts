import type { ModifierStats } from "@/lib/build/stats";
import type { BuffDefinition } from "@/lib/buffs";

export type WeaponType =
  | "SWORD"
  | "GREATSWORD"
  | "POLEARM"
  | "HANDCANNON"
  | "ARTS_UNIT";

export type WeaponSkillId =
  | "STR_UP"
  | "AGI_UP"
  | "INT_UP"
  | "WIL_UP"
  | "MAIN_ATTR_UP"
  | "SECONDARY_ATTR_UP"
  | "ARTS_INTENSITY_UP"
  | "ATK_UP"
  | "CRIT_UP"
  | "ULT_GAIN_UP"
  | "ARTS_DMG_UP"
  | "CRYO_DMG_UP"
  | "HEALING_UP"
  | "UNIQUE"
  | "NotImplemented";

export type WeaponSkillDef = {
  id: WeaponSkillId;
  name: string;
  rank: number;
  implemented: boolean;
};

export type WeaponPassiveContext = {
  skillLevels: number[]; // [skill1, skill2, skill3]
};

export type WeaponPassiveDef = {
  alwaysOn?: (ctx: WeaponPassiveContext) => Partial<ModifierStats>;
  buffs?: (ctx: WeaponPassiveContext) => BuffDefinition[];
};

export type WeaponBase = {
  id: string;
  name: string;
  weaponType: WeaponType;
  baseAtkLv1: number;
  baseAtkLv90: number;
  skills: [WeaponSkillDef, WeaponSkillDef, WeaponSkillDef];
  passive?: WeaponPassiveDef;
};

import * as handcannon from "./weap/handcannons";
import * as sword from "./weap/swords";
import * as artsunit from "./weap/artsunits";

export const WEAPONS: WeaponBase[] = [
  sword.FORGEBORN_SCATHE,
  sword.THERMITE_CUTTER,
  handcannon.ARTSY_TYRANNICAL,
  handcannon.CLANNIBAL,
  artsunit.DELIVERY_GUARANTEED,
  artsunit.STANZA_OF_MEMORIALS,
  artsunit.DETONATION_UNIT,
  artsunit.DREAMS_OF_THE_STARRY_BEACH,
];