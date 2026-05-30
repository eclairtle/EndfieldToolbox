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
  | "HP_UP"
  | "ARTS_DMG_UP"
  | "PHYSICAL_DMG_UP"
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

import type { ModifierStatKey, ModifierStats } from "@/lib/build/stats";
import type { CharacterCombatSnapshot, RotationCombatEvent } from "@/lib/combat/rotation";

export type WeaponEventListenerContext = {
  wearer: CharacterCombatSnapshot;
  event: RotationCombatEvent;
  helpers: {
    applySelfBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: "real" | "game";
      effects: Partial<ModifierStats>;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
    }): void;
    applyTeamBuff(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: "real" | "game";
      effects: Partial<ModifierStats>;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
    }): void;
    applyTeamBuffFiltered(args: {
      buffId: string;
      label: string;
      durationSeconds: number;
      timeScale?: "real" | "game";
      effects: Partial<ModifierStats>;
      shouldApplyTo: (target: CharacterCombatSnapshot) => boolean;
      stackGroup?: string;
      maxStacks?: number;
      refreshExistingStacks?: boolean;
      eventType?: "ACTOR_BUFF_APPLIED" | "WEAPON_BUFF_APPLIED";
    }): void;
    applyEnemyDebuff(args: {
      debuffId: string;
      label: string;
      stat: ModifierStatKey;
      value: number;
      durationSeconds: number;
      timeScale?: "real" | "game";
    }): void;
    applyEnemyBuff(args: {
      buffId: string;
      label: string;
      effects: Partial<ModifierStats>;
      durationSeconds: number;
      timeScale?: "real" | "game";
    }): void;
    markOnce(onceKey: string): boolean;
    tryActivateCooldown(args: {
      key: string;
      durationSeconds: number;
      timeScale?: "real" | "game";
    }): boolean;
    consumeThreshold(args: {
      key: string;
      amount: number;
      threshold?: number;
    }): number;
    getSelfBuffStackCount(buffId: string): number;
    removeSelfBuff(buffId: string): void;
  };
};

export type WeaponBase = {
  id: string;
  name: string;
  imagePath?: string;
  rarity?: 4 | 5 | 6;
  weaponType: WeaponType;
  baseAtkTable: readonly number[];
  tuningMaterials?: readonly [string, string];
  skills: [WeaponSkillDef, WeaponSkillDef, WeaponSkillDef];
  getUniqueStaticModifiers?: (uniqueSkillLevel: number) => Partial<ModifierStats>;
  getUniqueSkillDescription?: (uniqueSkillLevel: number) => string | null;
  onCombatEvent?: (ctx: WeaponEventListenerContext) => void;
};

import * as handcannon from "./weap/handcannons";
import * as sword from "./weap/swords";
import * as greatsword from "./weap/greatswords";
import * as artsunit from "./weap/artsunits";
import * as polearm from "./weap/polearms";
import { GENERATED_MISSING_WEAPONS } from "./weap/generatedMissing";

export const WEAPONS: WeaponBase[] = [
  sword.FORGEBORN_SCATHE,
  sword.THERMITE_CUTTER,
  sword.GRAND_VISION,
  greatsword.KHRAVENGGER,
  greatsword.EXEMPLAR,
  sword.EMINENT_REPUTE,
  sword.WHITE_NIGHT_NOVA,
  greatsword.FORMER_FINERY,
  sword.LUPINE_SCARLET,
  handcannon.ARTSY_TYRANNICAL,
  handcannon.CLANNIBAL,
  handcannon.BRIGANDS_CALLING,
  polearm.JET,
  polearm.MOUNTAIN_BEARER,
  artsunit.DELIVERY_GUARANTEED,
  artsunit.STANZA_OF_MEMORIALS,
  artsunit.DETONATION_UNIT,
  artsunit.DREAMS_OF_THE_STARRY_BEACH,
  artsunit.CHIVALRIC_VIRTUES,
  artsunit.MONAIHE,
  artsunit.WILD_WANDERER,
  ...GENERATED_MISSING_WEAPONS,
];

export function getWeaponById(id: string): WeaponBase | undefined {
  return WEAPONS.find((weapon) => weapon.id === id);
}
