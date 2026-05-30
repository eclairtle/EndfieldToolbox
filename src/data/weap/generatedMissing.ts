import type { WeaponBase } from "@/data/weapons";
import { ATK_TABLE_49_485, ATK_TABLE_50_490, ATK_TABLE_50_495, ATK_TABLE_51_500, ATK_TABLE_51_505, ATK_TABLE_52_510, ATK_TABLE_42_411 } from "@/data/weap/baseAtkTables";

function pickUniqueDescription(level: number, descriptions: readonly string[]): string | null {
  if (descriptions.length === 0) return null;
  const idx = Math.max(0, Math.min(descriptions.length - 1, Math.floor(level) - 1));
  return descriptions[idx] ?? descriptions[0] ?? null;
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scaledPercentFromRank1(rank1Percent: number, y: number): number {
  return rank1Percent * (0.8 + 0.2 * y);
}

function scaledFlatFromRank1(rank1Value: number, y: number): number {
  return rank1Value * (0.8 + 0.2 * y);
}

function skillY(level: number): number {
  return Math.max(1, Math.min(9, Math.floor(level)));
}

function applyEmergencyBoostOnBattleSkillHit(
  ctx: Parameters<NonNullable<WeaponBase["onCombatEvent"]>>[0],
  opts: { buffId: string; label: string; atkPctAtRank1: number; durationSeconds?: number },
): void {
  const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
  if (
    sourceSlot !== ctx.wearer.slot
    || ctx.event.type !== "BATTLE_SKILL_HIT"
  ) {
    return;
  }

  const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
  ctx.helpers.applySelfBuff({
    buffId: opts.buffId,
    label: opts.label,
    durationSeconds: opts.durationSeconds ?? 15,
    effects: {
      ATK_PCT: scaledPercentFromRank1(opts.atkPctAtRank1, y) / 100,
    },
    eventType: "WEAPON_BUFF_APPLIED",
  });
}

function applyComboCastAtkBoost(
  ctx: Parameters<NonNullable<WeaponBase["onCombatEvent"]>>[0],
  opts: { buffId: string; label: string; atkPctAtRank1: number; durationSeconds?: number },
): void {
  const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
  if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "COMBO_SKILL_CAST") {
    return;
  }

  const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
  ctx.helpers.applySelfBuff({
    buffId: opts.buffId,
    label: opts.label,
    durationSeconds: opts.durationSeconds ?? 15,
    effects: {
      ATK_PCT: scaledPercentFromRank1(opts.atkPctAtRank1, y) / 100,
    },
    eventType: "WEAPON_BUFF_APPLIED",
  });
}

const AGGELOSLAYER_UNIQUE_DESCRIPTIONS = [
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const AGGELOSLAYER: WeaponBase = {
  id: "aggeloslayer",
  name: "Aggeloslayer",
  rarity: 4,
  imagePath: "/weapons/lance/wpn_lance_0008.webp",
  weaponType: "POLEARM",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [S]", rank: 3, implemented: true },
    { id: "ARTS_DMG_UP", name: "Arts Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Emergency Boost", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, AGGELOSLAYER_UNIQUE_DESCRIPTIONS),
  onCombatEvent: (ctx) => {
    applyEmergencyBoostOnBattleSkillHit(ctx, {
      buffId: "weapon_aggeloslayer_emergency_boost",
      label: "Aggeloslayer",
      atkPctAtRank1: 12,
    });
  },
};

const ANCIENT_CANAL_UNIQUE_DESCRIPTIONS = [
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.
After the wielder <#ba.consume>consumes</> <#ba.noguard>Vulnerability</> stack(s), the wielder gains Physical DMG Dealt <@ba.vup>+[{phy_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const ANCIENT_CANAL: WeaponBase = {
  id: "ancient_canal",
  name: "Ancient Canal",
  rarity: 5,
  imagePath: "/weapons/claym/wpn_claym_0014.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Brutality: Lands of Yore", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, ANCIENT_CANAL_UNIQUE_DESCRIPTIONS),
};

const ASPIRANT_UNIQUE_DESCRIPTIONS = [
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
  `Ultimate DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
After the wielder applies <#ba.airborne>Lifted</>, during the next ultimate cast within {duration:0}s, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.5s.</>`,
] as const;

export const ASPIRANT: WeaponBase = {
  id: "aspirant",
  name: "Aspirant",
  rarity: 5,
  imagePath: "/weapons/sword/wpn_sword_0015.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_4 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Physical DMG Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Twilight: Imposing Peak", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, ASPIRANT_UNIQUE_DESCRIPTIONS),
};

const CHIMERIC_JUSTICE_UNIQUE_DESCRIPTIONS = [
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies <#ba.noguard>Vulnerability</> to an enemy with no <#ba.noguard>Vulnerability</> stacks, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const CHIMERIC_JUSTICE: WeaponBase = {
  id: "chimeric_justice",
  name: "Chimeric Justice",
  rarity: 5,
  imagePath: "/weapons/lance/wpn_lance_0004.webp",
  weaponType: "POLEARM",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Ultimate Gain Efficiency Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Brutality: Cemented Fury", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, CHIMERIC_JUSTICE_UNIQUE_DESCRIPTIONS),
};

const COHESIVE_TRACTION_UNIQUE_DESCRIPTIONS = [
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Combo Skill DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder casts a combo skill, during the next battle skill cast within {duration:0}s, the wielder gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
] as const;

export const COHESIVE_TRACTION: WeaponBase = {
  id: "cohesive_traction",
  name: "Cohesive Traction",
  rarity: 5,
  imagePath: "/weapons/lance/wpn_lance_0006.webp",
  weaponType: "POLEARM",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Electric DMG Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Suppression: Concentric Circles", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, COHESIVE_TRACTION_UNIQUE_DESCRIPTIONS),
};

const DARHOFF_7_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
] as const;

export const DARHOFF_7: WeaponBase = {
  id: "darhoff_7",
  name: "Darhoff 7",
  imagePath: "/weapons/claym/wpn_claym_0010.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: [29, 31, 34, 37, 40, 43, 46, 49, 51, 54, 57, 60, 63, 66, 69, 71, 74, 77, 80, 83, 86, 89, 91, 94, 97, 100, 103, 106, 109, 111, 114, 117, 120, 123, 126, 129, 132, 134, 137, 140, 143, 146, 149, 152, 154, 157, 160, 163, 166, 169, 172, 174, 177, 180, 183, 186, 189, 192, 194, 197, 200, 203, 206, 209, 212, 214, 217, 220, 223, 226, 229, 232, 234, 237, 240, 243, 246, 249, 252, 254, 257, 260, 263, 266, 269, 272, 274, 277, 280, 283] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Assault: Armament Prep", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Skill 3", rank: 1, implemented: false },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, DARHOFF_7_UNIQUE_DESCRIPTIONS),
};

const FINCHASER_30_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.frozen>Solidification</>, target enemy suffers Cryo DMG Taken <@ba.vup>+{cryst_dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const FINCHASER_30: WeaponBase = {
  id: "finchaser_30",
  name: "Finchaser 3.0",
  rarity: 5,
  imagePath: "/weapons/sword/wpn_sword_0020.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 3, implemented: true },
    { id: "CRYO_DMG_UP", name: "Cryo DMG Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Fin Chaser's Intent", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, FINCHASER_30_UNIQUE_DESCRIPTIONS),
};

const FINISHING_CALL_UNIQUE_DESCRIPTIONS = [
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
Combo skill HP treatment effect <@ba.vup>+{heal_up:0.0%}</>.`,
] as const;

export const FINISHING_CALL: WeaponBase = {
  id: "finishing_call",
  name: "Finishing Call",
  rarity: 5,
  imagePath: "/weapons/claym/wpn_claym_0012.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_4 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 3, implemented: true },
    { id: "HP_UP", name: "HP Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Medicant: Glory of Knighthood", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, FINISHING_CALL_UNIQUE_DESCRIPTIONS),
};

const FLICKERS_IN_THE_MIST_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder gains <#ba.pulseenhance>Electric Amp</>, the wielder also gains Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s. 
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. This effect only triggers once every 0.1s.</>`,
] as const;

export const FLICKERS_IN_THE_MIST: WeaponBase = {
  id: "flickers_in_the_mist",
  name: "Flickers in the Mist",
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0017.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Electric DMG Boost [L]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Efficacy: Overlapping Flickers", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, FLICKERS_IN_THE_MIST_UNIQUE_DESCRIPTIONS),
};

const FLUORESCENT_ROC_UNIQUE_DESCRIPTIONS = [
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const FLUORESCENT_ROC: WeaponBase = {
  id: "fluorescent_roc",
  name: "Fluorescent Roc",
  rarity: 4,
  imagePath: "/weapons/funnel/wpn_funnel_0003.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [S]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Emergency Boost", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, FLUORESCENT_ROC_UNIQUE_DESCRIPTIONS),
  onCombatEvent: (ctx) => {
    applyEmergencyBoostOnBattleSkillHit(ctx, {
      buffId: "weapon_fluorescent_roc_emergency_boost",
      label: "Fluorescent Roc",
      atkPctAtRank1: 12,
    });
  },
};

const FORTMAKER_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Arts Intensity <@ba.vup>+{phy_spell_up:0}</>.`,
] as const;

export const FORTMAKER: WeaponBase = {
  id: "fortmaker",
  name: "Fortmaker",
  rarity: 5,
  imagePath: "/weapons/sword/wpn_sword_0007.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Ultimate Gain Efficiency Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Inspiring: Back to the Broken City", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, FORTMAKER_UNIQUE_DESCRIPTIONS),
};

const FREEDOM_TO_PROSELYTIZE_UNIQUE_DESCRIPTIONS = [
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
  `Main Attribute <@ba.vup>+{all_attr_up:0.0%}</>.
When the wielder's battle skill provides HP treatment, the controlled operator is restored for another <@ba.heal>[{hp_will_add:0} + Will×{hp_will_mult:0.0}]</> HP.
Effect only triggers once <@ba.info>every {cd:0}s.</>`,
] as const;

export const FREEDOM_TO_PROSELYTIZE: WeaponBase = {
  id: "freedom_to_proselytize",
  name: "Freedom to Proselytize",
  rarity: 5,
  imagePath: "/weapons/funnel/wpn_funnel_0012.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [M]", rank: 3, implemented: true },
    { id: "HEALING_UP", name: "Treatment Efficiency Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Medicant: Redemption of Faith", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, FREEDOM_TO_PROSELYTIZE_UNIQUE_DESCRIPTIONS),
};

const GLORIOUS_MEMORY_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's skill applies <#ba.noguard>Vulnerability</>, during the next ultimate cast within {duration:0}s, the wielder gains DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect is only triggered once every 0.5s.</>`,
] as const;

export const GLORIOUS_MEMORY: WeaponBase = {
  id: "glorious_memory",
  name: "Glorious Memory",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0017.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Twilight: Lingering Glow", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, GLORIOUS_MEMORY_UNIQUE_DESCRIPTIONS),
};

const HOME_LONGING_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
For {duration:0}s after the wielder casts a combo skill, the wielder's next battle skill gains Cryo and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
] as const;

export const HOME_LONGING: WeaponBase = {
  id: "home_longing",
  name: "Home Longing",
  rarity: 6,
  imagePath: "/weapons/pistol/wpn_pistol_0007.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "CRYO_DMG_UP", name: "Cryo DMG Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Olden Moon", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, HOME_LONGING_UNIQUE_DESCRIPTIONS),
};

const HOWLING_GUARD_UNIQUE_DESCRIPTIONS = [
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const HOWLING_GUARD: WeaponBase = {
  id: "howling_guard",
  name: "Howling Guard",
  rarity: 4,
  imagePath: "/weapons/pistol/wpn_pistol_0002.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [S]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Emergency Boost", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, HOWLING_GUARD_UNIQUE_DESCRIPTIONS),
  onCombatEvent: (ctx) => {
    applyEmergencyBoostOnBattleSkillHit(ctx, {
      buffId: "weapon_howling_guard_emergency_boost",
      label: "Howling Guard",
      atkPctAtRank1: 12,
    });
  },
};

const HYPERNOVA_AUTO_UNIQUE_DESCRIPTIONS = [
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
] as const;

export const HYPERNOVA_AUTO: WeaponBase = {
  id: "hypernova_auto",
  name: "Hypernova Auto",
  rarity: 4,
  imagePath: "/weapons/funnel/wpn_funnel_0001.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [S]", rank: 3, implemented: true },
    { id: "ARTS_DMG_UP", name: "Arts Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Inspiring: Start of a Saga", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, HYPERNOVA_AUTO_UNIQUE_DESCRIPTIONS),
};

const INDUSTRY_01_UNIQUE_DESCRIPTIONS = [
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const INDUSTRY_01: WeaponBase = {
  id: "industry_01",
  name: "Industry 0.1",
  rarity: 4,
  imagePath: "/weapons/claym/wpn_claym_0003.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_4 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [S]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Emergency Boost", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, INDUSTRY_01_UNIQUE_DESCRIPTIONS),
  onCombatEvent: (ctx) => {
    applyEmergencyBoostOnBattleSkillHit(ctx, {
      buffId: "weapon_industry_01_emergency_boost",
      label: "Industry 01",
      atkPctAtRank1: 12,
    });
  },
};

const JIMINY_12_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
] as const;

export const JIMINY_12: WeaponBase = {
  id: "jiminy_12",
  name: "Jiminy 12",
  imagePath: "/weapons/funnel/wpn_funnel_0002.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: [29, 31, 34, 37, 40, 43, 46, 49, 51, 54, 57, 60, 63, 66, 69, 71, 74, 77, 80, 83, 86, 89, 91, 94, 97, 100, 103, 106, 109, 111, 114, 117, 120, 123, 126, 129, 132, 134, 137, 140, 143, 146, 149, 152, 154, 157, 160, 163, 166, 169, 172, 174, 177, 180, 183, 186, 189, 192, 194, 197, 200, 203, 206, 209, 212, 214, 217, 220, 223, 226, 229, 232, 234, 237, 240, 243, 246, 249, 252, 254, 257, 260, 263, 266, 269, 272, 274, 277, 280, 283] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Assault: Armament Prep", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Skill 3", rank: 1, implemented: false },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, JIMINY_12_UNIQUE_DESCRIPTIONS),
};

const LONE_BARGE_UNIQUE_DESCRIPTIONS = [
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
  `Electric DMG Dealt <@ba.vup>+{pulse_dmg_up:0.0%}</>.
When the wielder's battle skill <#ba.consume>consumes</><#ba.spellstatus> Arts Reactions</>, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up2:0.0%}</> for {duration:0}s.
<@ba.info>This effect can reach a max of {max_stack:0} stacks and can only trigger once every 0.1s. Duration of each stack is counted separately.</>
After the wielder casts an ultimate, the wielder gains Battle Skill Electric DMG Dealt <@ba.vup>+{pulse_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>This effect cannot stack.</>`,
] as const;

export const LONE_BARGE: WeaponBase = {
  id: "lone_barge",
  name: "Lone Barge",
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0015.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_52_510,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Streaming Blitz", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, LONE_BARGE_UNIQUE_DESCRIPTIONS),
};

const LONG_ROAD_UNIQUE_DESCRIPTIONS = [
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const LONG_ROAD: WeaponBase = {
  id: "long_road",
  name: "Long Road",
  rarity: 4,
  imagePath: "/weapons/pistol/wpn_pistol_0003.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [S]", rank: 3, implemented: true },
    { id: "ARTS_DMG_UP", name: "Arts Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Pursuit: Unending Cycle", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, LONG_ROAD_UNIQUE_DESCRIPTIONS),
  onCombatEvent: (ctx) => {
    applyComboCastAtkBoost(ctx, {
      buffId: "weapon_long_road_combo_atk_boost",
      label: "Long Road",
      atkPctAtRank1: 12,
    });
  },
};

const NAVIGATOR_UNIQUE_DESCRIPTIONS = [
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When <#ba.frozen>Solidification</> or <#ba.corrupt>Corrosion</> is applied to enemies, the wielder gains Cryo DMG Dealt and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>, and Critical Rate <@ba.vup>+{crit_up2:0.0%}</> for {duration:0}s. If this effect is triggered by the wielder, double the increase gained.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const NAVIGATOR: WeaponBase = {
  id: "navigator",
  name: "Navigator",
  rarity: 6,
  imagePath: "/weapons/pistol/wpn_pistol_0005.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "CRYO_DMG_UP", name: "Cryo DMG Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Lone and Distant Sail", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, NAVIGATOR_UNIQUE_DESCRIPTIONS),
};

const NEVER_REST_UNIQUE_DESCRIPTIONS = [
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
After the wielder's skill recovers SP, the wielder gains Physical DMG Dealt <@ba.vup>+{phy_dmg_up2:0.0%}</> while other operators in the team gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up3:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
] as const;

export const NEVER_REST: WeaponBase = {
  id: "never_rest",
  name: "Never Rest",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0016.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_51_500,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Flow: Reincarnation", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, NEVER_REST_UNIQUE_DESCRIPTIONS),
};

const OBJ_ARTS_IDENTIFIER_UNIQUE_DESCRIPTIONS = [
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Max HP <@ba.vup>+{hp_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.physicalstatus>Physical Status</>, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const OBJ_ARTS_IDENTIFIER: WeaponBase = {
  id: "obj_arts_identifier",
  name: "OBJ Arts Identifier",
  rarity: 5,
  imagePath: "/weapons/funnel/wpn_funnel_0014.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [M]", rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Pursuit: Transcendent Arts", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OBJ_ARTS_IDENTIFIER_UNIQUE_DESCRIPTIONS),
};

const OBJ_EDGE_OF_LIGHTNESS_UNIQUE_DESCRIPTIONS = [
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder's skill recovers SP, the entire team gains Heat DMG Dealt and Electric DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
] as const;

export const OBJ_EDGE_OF_LIGHTNESS: WeaponBase = {
  id: "obj_edge_of_lightness",
  name: "OBJ Edge of Lightness",
  rarity: 5,
  imagePath: "/weapons/sword/wpn_sword_0019.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [M]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Flow: Unbridled Edge", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OBJ_EDGE_OF_LIGHTNESS_UNIQUE_DESCRIPTIONS),
};

const OBJ_HEAVY_BURDEN_UNIQUE_DESCRIPTIONS = [
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
When the wielder applies <#ba.knockdown>Knocked Down</> or <#ba.weak>Weakened</>, the wielder gains DEF <@ba.vup>+{def_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const OBJ_HEAVY_BURDEN: WeaponBase = {
  id: "obj_heavy_burden",
  name: "OBJ Heavy Burden",
  rarity: 5,
  imagePath: "/weapons/claym/wpn_claym_0015.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 3, implemented: true },
    { id: "HP_UP", name: "HP Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Efficacy: Tenacious Will", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OBJ_HEAVY_BURDEN_UNIQUE_DESCRIPTIONS),
};

const OBJ_RAZORHORN_UNIQUE_DESCRIPTIONS = [
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `To enemies with <#ba.crystinflict>Cryo Infliction</> or <#ba.frozen>Solidification</>, the wielder gains DMG Dealt <@ba.vup>+{dmg_up :0.0%}</>. After <#ba.consume>consuming</> <#ba.frozen>Solidification</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const OBJ_RAZORHORN: WeaponBase = {
  id: "obj_razorhorn",
  name: "OBJ Razorhorn",
  rarity: 5,
  imagePath: "/weapons/lance/wpn_lance_0013.webp",
  weaponType: "POLEARM",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_4 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Physical DMG Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Infliction: Conquest of Icy Peaks", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OBJ_RAZORHORN_UNIQUE_DESCRIPTIONS),
};

const OBJ_VELOCITOUS_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellinflict>Arts Infliction</>, the wielder gains Nature DMG Dealt <@ba.vup>+[{nature_dmg_up_mult:0.0%}×Stacks Consumed]</> for {duration:0}s. 
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const OBJ_VELOCITOUS: WeaponBase = {
  id: "obj_velocitous",
  name: "OBJ Velocitous",
  rarity: 5,
  imagePath: "/weapons/pistol/wpn_pistol_0012.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Ultimate Gain Efficiency Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Detonate: Rapid Strike", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OBJ_VELOCITOUS_UNIQUE_DESCRIPTIONS),
};

const OBLIVION_UNIQUE_DESCRIPTIONS = [
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder casts an ultimate, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. When the wielder casts a combo skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
] as const;

export const OBLIVION: WeaponBase = {
  id: "oblivion",
  name: "Oblivion",
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0009.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_50_495,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "ARTS_DMG_UP", name: "Arts Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Twilight: Humiliation", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OBLIVION_UNIQUE_DESCRIPTIONS),
};

const OPERO_77_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
] as const;

export const OPERO_77: WeaponBase = {
  id: "opero_77",
  name: "Opero 77",
  imagePath: "/weapons/lance/wpn_lance_0009.webp",
  weaponType: "POLEARM",
  baseAtkTable: [29, 31, 34, 37, 40, 43, 46, 49, 51, 54, 57, 60, 63, 66, 69, 71, 74, 77, 80, 83, 86, 89, 91, 94, 97, 100, 103, 106, 109, 111, 114, 117, 120, 123, 126, 129, 132, 134, 137, 140, 143, 146, 149, 152, 154, 157, 160, 163, 166, 169, 172, 174, 177, 180, 183, 186, 189, 192, 194, 197, 200, 203, 206, 209, 212, 214, 217, 220, 223, 226, 229, 232, 234, 237, 240, 243, 246, 249, 252, 254, 257, 260, 263, 266, 269, 272, 274, 277, 280, 283] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Assault: Armament Prep", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Skill 3", rank: 1, implemented: false },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OPERO_77_UNIQUE_DESCRIPTIONS),
};

const OPUS_ETCH_FIGURE_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
When the wielder's battle skill applies <#ba.naturalinflict>Nature Infliction</>, other operators in the team gain Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</> for {duration:0}s. For every enemy suffering from <#ba.naturalinflict>Nature Infliction</> applied by the said battle skill, other operators in the team gain bonus Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</>, up to a max of <@ba.vup>+{spell_dmg_up2*max_stack:0.0%}</>.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const OPUS_ETCH_FIGURE: WeaponBase = {
  id: "opus_etch_figure",
  name: "Opus: Etch Figure",
  rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0006.webp",
  weaponType: "ARTS_UNIT",
  baseAtkTable: ATK_TABLE_49_485,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_4 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Nature DMG Boost [L]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Suppression: Tillite Etchings", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OPUS_ETCH_FIGURE_UNIQUE_DESCRIPTIONS),
};

const OPUS_THE_LIVING_UNIQUE_DESCRIPTIONS = [
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Critical Rate <@ba.vup>+{crit_up:0.0%}</>.
When the wielder applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
] as const;

export const OPUS_THE_LIVING: WeaponBase = {
  id: "opus_the_living",
  name: "Opus: The Living",
  rarity: 5,
  imagePath: "/weapons/pistol/wpn_pistol_0006.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [M]", rank: 3, implemented: true },
    { id: "ARTS_DMG_UP", name: "Arts Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Road Home for All Life", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, OPUS_THE_LIVING_UNIQUE_DESCRIPTIONS),
};

const PATHFINDERS_BEACON_UNIQUE_DESCRIPTIONS = [
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
  `When the wielder's HP is above <@ba.vup>{hp_ratio_c:0%}</>, ATK <@ba.vup>+{atk_up:0.0%}</>.`,
] as const;

export const PATHFINDERS_BEACON: WeaponBase = {
  id: "pathfinders_beacon",
  name: "Pathfinder's Beacon",
  rarity: 4,
  imagePath: "/weapons/lance/wpn_lance_0003.webp",
  weaponType: "POLEARM",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [S]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Inspiring: Start of a Saga", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, PATHFINDERS_BEACON_UNIQUE_DESCRIPTIONS),
};

const PECO_5_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
] as const;

export const PECO_5: WeaponBase = {
  id: "peco_5",
  name: "Peco 5",
  imagePath: "/weapons/pistol/wpn_pistol_0001.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: [29, 31, 34, 37, 40, 43, 46, 49, 51, 54, 57, 60, 63, 66, 69, 71, 74, 77, 80, 83, 86, 89, 91, 94, 97, 100, 103, 106, 109, 111, 114, 117, 120, 123, 126, 129, 132, 134, 137, 140, 143, 146, 149, 152, 154, 157, 160, 163, 166, 169, 172, 174, 177, 180, 183, 186, 189, 192, 194, 197, 200, 203, 206, 209, 212, 214, 217, 220, 223, 226, 229, 232, 234, 237, 240, 243, 246, 249, 252, 254, 257, 260, 263, 266, 269, 272, 274, 277, 280, 283] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_4 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Assault: Armament Prep", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Skill 3", rank: 1, implemented: false },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, PECO_5_UNIQUE_DESCRIPTIONS),
};

const PROMINENT_EDGE_UNIQUE_DESCRIPTIONS = [
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder's battle skill hits the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const PROMINENT_EDGE: WeaponBase = {
  id: "prominent_edge",
  name: "Prominent Edge",
  rarity: 4,
  imagePath: "/weapons/sword/wpn_sword_0008.webp",
  weaponType: "SWORD",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [S]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Physical DMG Boost [S]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Suppression: Emergency Boost", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, PROMINENT_EDGE_UNIQUE_DESCRIPTIONS),
};

const QUENCHER_UNIQUE_DESCRIPTIONS = [
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const QUENCHER: WeaponBase = {
  id: "quencher",
  name: "Quencher",
  rarity: 4,
  imagePath: "/weapons/claym/wpn_claym_0009.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [S]", rank: 3, implemented: true },
    { id: "HP_UP", name: "HP Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Crusher: Honed into Legion", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, QUENCHER_UNIQUE_DESCRIPTIONS),
};

const RAPID_ASCENT_UNIQUE_DESCRIPTIONS = [
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
  `Battle skills and ultimates gain Physical DMG Dealt <@ba.vup>+{phy_dmg_up:0.0%}</>.
Against <@ba.poise>Staggered</> enemies, battle skills and ultimates also gain DMG Dealt <@ba.vup>+{dmg_up:0.0%}</>.`,
] as const;

export const RAPID_ASCENT: WeaponBase = {
  id: "rapid_ascent",
  name: "Rapid Ascent",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0011.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_50_495,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Twilight: Azure Clouds", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, RAPID_ASCENT_UNIQUE_DESCRIPTIONS),
};

const RATIONAL_FAREWELL_UNIQUE_DESCRIPTIONS = [
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
  `Battle Skill DMG <@ba.vup>+{dmg_up:0.0%}</>.
When the wielder's combo skill applies <#ba.spellburst>Arts Burst</> or <#ba.burning>Combusted</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const RATIONAL_FAREWELL: WeaponBase = {
  id: "rational_farewell",
  name: "Rational Farewell",
  rarity: 5,
  imagePath: "/weapons/pistol/wpn_pistol_0004.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Heat DMG Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Pursuit: Aid from the Past", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, RATIONAL_FAREWELL_UNIQUE_DESCRIPTIONS),
};

const SEEKER_OF_DARK_LUNG_UNIQUE_DESCRIPTIONS = [
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `Main Attribute <@ba.vup>+{primary_attr_up:0.0%}</>.
When the wielder applies an <#ba.spellburst>Arts Burst</>, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
] as const;

export const SEEKER_OF_DARK_LUNG: WeaponBase = {
  id: "seeker_of_dark_lung",
  name: "Seeker of Dark Lung",
  rarity: 5,
  imagePath: "/weapons/claym/wpn_claym_0011.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Ultimate Gain Efficiency Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Detonate: Seeker of the Esoteric", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, SEEKER_OF_DARK_LUNG_UNIQUE_DESCRIPTIONS),
};

const SUNDERED_PRINCE_UNIQUE_DESCRIPTIONS = [
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
  `When the wielder performs a <#ba.lastcombo>Final Strike</> on the enemy, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
If the wielder is also the controlled operator, double the ATK increase gained and buff the <#ba.lastcombo>Final Strike</> so that it deals Stagger <@ba.vup>+{poise_up:0.0%}</> to the enemy.
<@ba.info>Effects of the same name cannot stack.</>`,
] as const;

export const SUNDERED_PRINCE: WeaponBase = {
  id: "sundered_prince",
  name: "Sundered Prince",
  rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0008.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Crusher: Princely Deterrence", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, SUNDERED_PRINCE_UNIQUE_DESCRIPTIONS),
};

const SUNDERING_STEEL_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up1:0.0%}</>.
When the wielder deals a <#ba.physicalstatus>Physical Status</>, the wielder gains ATK <@ba.vup>+{atk_up2:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
] as const;

export const SUNDERING_STEEL: WeaponBase = {
  id: "sundering_steel",
  name: "Sundering Steel",
  rarity: 5,
  imagePath: "/weapons/sword/wpn_sword_0005.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [M]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Physical DMG Boost [M]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Combative: Anthem of Cinder", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, SUNDERING_STEEL_UNIQUE_DESCRIPTIONS),
};

const TARR_11_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
  `ATK <@ba.vup>+{atk_up:0}</>.`,
] as const;

export const TARR_11: WeaponBase = {
  id: "tarr_11",
  name: "Tarr 11",
  imagePath: "/weapons/sword/wpn_sword_0003.webp",
  weaponType: "SWORD",
  baseAtkTable: [29, 31, 34, 37, 40, 43, 46, 49, 51, 54, 57, 60, 63, 66, 69, 71, 74, 77, 80, 83, 86, 89, 91, 94, 97, 100, 103, 106, 109, 111, 114, 117, 120, 123, 126, 129, 132, 134, 137, 140, 143, 146, 149, 152, 154, 157, 160, 163, 166, 169, 172, 174, 177, 180, 183, 186, 189, 192, 194, 197, 200, 203, 206, 209, 212, 214, 217, 220, 223, 226, 229, 232, 234, 237, 240, 243, 246, 249, 252, 254, 257, 260, 263, 266, 269, 272, 274, 277, 280, 283] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Assault: Armament Prep", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Skill 3", rank: 1, implemented: false },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, TARR_11_UNIQUE_DESCRIPTIONS),
};

const THUNDERBERGE_UNIQUE_DESCRIPTIONS = [
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
  `<#ba.shield>Shield</> applied <@ba.heal>+{shield_up:0.0%}</>.
After the wielder's combo skill provides HP treatment, the controlled operator gains an additional <@ba.heal>[{hp_ratio:0.0%}×Wielder's Max HP]</> <#ba.shield>Shield</> for {duration:0}s.
<@ba.info>Effect only triggers once every {cd:0}s.</>`,
] as const;

export const THUNDERBERGE: WeaponBase = {
  id: "thunderberge",
  name: "Thunderberge",
  rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0007.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_50_495,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_2 ×16"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [L]", rank: 3, implemented: true },
    { id: "HP_UP", name: "HP Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Medicant: Eye of Talos", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, THUNDERBERGE_UNIQUE_DESCRIPTIONS),
};

const TWELVE_QUESTIONS_UNIQUE_DESCRIPTIONS = [
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
  `Secondary Attribute <@ba.vup>+{second_attr_up:0.0%}</>.
After the wielder <#ba.consume>consumes</> an <#ba.spellstatus>Arts Reaction</>, ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately.</>`,
] as const;

export const TWELVE_QUESTIONS: WeaponBase = {
  id: "twelve_questions",
  name: "Twelve Questions",
  rarity: 5,
  imagePath: "/weapons/sword/wpn_sword_0018.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_42_411,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [M]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK Boost [M]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Sincere Interrogation", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, TWELVE_QUESTIONS_UNIQUE_DESCRIPTIONS),
};

const UMBRAL_TORCH_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
Whenever <#ba.burning>Combustion</> or <#ba.corrupt>Corrosion</> is applied to an enemy, the wielder gains Heat and Nature DMG Dealt <@ba.vup>+{dmg_up:0.0%}</> for {duration:0}s.
<@ba.info>Max stacks for effects of the same name: {max_stack:0}. Duration of each stack is counted separately. Effect only triggers once every 0.1s.</>`,
] as const;

export const UMBRAL_TORCH: WeaponBase = {
  id: "umbral_torch",
  name: "Umbral Torch",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0010.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Heat DMG Boost [L]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Infliction: Covetous Buildup", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, UMBRAL_TORCH_UNIQUE_DESCRIPTIONS),
};

const VALIANT_UNIQUE_DESCRIPTIONS = [
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
  `ATK <@ba.vup>+{atk_up:0.0%}</>.
After the wielder applies <#ba.physicalstatus>Physical Statuses</>, the wielder also deals another hit of Physical DMG equal to <@ba.vup>{atk_scale:0.0%}</> of the wielder's ATK.`,
] as const;

export const VALIANT: WeaponBase = {
  id: "valiant",
  name: "Valiant",
  rarity: 6,
  imagePath: "/weapons/lance/wpn_lance_0010.webp",
  weaponType: "POLEARM",
  baseAtkTable: ATK_TABLE_50_495,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "NotImplemented", name: "Physical DMG Boost [L]", rank: 3, implemented: false },
    { id: "UNIQUE", name: "Combative: Virtuous Gain", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, VALIANT_UNIQUE_DESCRIPTIONS),
};

const WAVE_TIDE_UNIQUE_DESCRIPTIONS = [
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
  `When the wielder casts a combo skill, the wielder gains ATK <@ba.vup>+{atk_up:0.0%}</> for {duration:0}s.
<@ba.info>Effects of the same name cannot stack. </>`,
] as const;

export const WAVE_TIDE: WeaponBase = {
  id: "wave_tide",
  name: "Wave Tide",
  rarity: 4,
  imagePath: "/weapons/sword/wpn_sword_0009.webp",
  weaponType: "SWORD",
  baseAtkTable: [34, 38, 41, 45, 48, 52, 55, 59, 62, 65, 69, 72, 76, 79, 83, 86, 90, 93, 96, 100, 103, 107, 110, 114, 117, 121, 124, 127, 131, 134, 138, 141, 145, 148, 152, 155, 158, 162, 165, 169, 172, 176, 179, 183, 186, 189, 193, 196, 200, 203, 207, 210, 214, 217, 220, 224, 227, 231, 234, 238, 241, 245, 248, 251, 255, 258, 262, 265, 269, 272, 276, 279, 282, 286, 289, 293, 296, 300, 303, 307, 310, 313, 317, 320, 324, 327, 331, 334, 338, 341] as const,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_4 ×16"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [S]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "ATK Boost [S]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Pursuit: Unending Cycle", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, WAVE_TIDE_UNIQUE_DESCRIPTIONS),
  onCombatEvent: (ctx) => {
    applyComboCastAtkBoost(ctx, {
      buffId: "weapon_wave_tide_combo_atk_boost",
      label: "Wave Tide",
      atkPctAtRank1: 12,
    });
  },
};

const WEDGE_UNIQUE_DESCRIPTIONS = [
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
  `Arts DMG Dealt <@ba.vup>+{spell_dmg_up:0.0%}</>.
When the wielder casts a battle skill, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up2:0.0%}</> for {duration:0}s. When the wielder's battle skill applies an <#ba.spellstatus>Arts Reaction</>, the wielder gains Arts DMG Dealt <@ba.vup>+{spell_dmg_up3:0.0%}</> for {duration2:0}s.
<@ba.info>The two effects apply separately and do not stack with themselves.</>`,
] as const;

export const WEDGE: WeaponBase = {
  id: "wedge",
  name: "Wedge",
  rarity: 6,
  imagePath: "/weapons/pistol/wpn_pistol_0008.webp",
  weaponType: "HANDCANNON",
  baseAtkTable: ATK_TABLE_51_500,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_3 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Wedge of Civilization", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (uniqueSkillLevel) => pickUniqueDescription(uniqueSkillLevel, WEDGE_UNIQUE_DESCRIPTIONS),
};

export const GENERATED_MISSING_WEAPONS: WeaponBase[] = [
  AGGELOSLAYER,
  ANCIENT_CANAL,
  ASPIRANT,
  CHIMERIC_JUSTICE,
  COHESIVE_TRACTION,
  DARHOFF_7,
  FINCHASER_30,
  FINISHING_CALL,
  FLICKERS_IN_THE_MIST,
  FLUORESCENT_ROC,
  FORTMAKER,
  FREEDOM_TO_PROSELYTIZE,
  GLORIOUS_MEMORY,
  HOME_LONGING,
  HOWLING_GUARD,
  HYPERNOVA_AUTO,
  INDUSTRY_01,
  JIMINY_12,
  LONE_BARGE,
  LONG_ROAD,
  NAVIGATOR,
  NEVER_REST,
  OBJ_ARTS_IDENTIFIER,
  OBJ_EDGE_OF_LIGHTNESS,
  OBJ_HEAVY_BURDEN,
  OBJ_RAZORHORN,
  OBJ_VELOCITOUS,
  OBLIVION,
  OPERO_77,
  OPUS_ETCH_FIGURE,
  OPUS_THE_LIVING,
  PATHFINDERS_BEACON,
  PECO_5,
  PROMINENT_EDGE,
  QUENCHER,
  RAPID_ASCENT,
  RATIONAL_FAREWELL,
  SEEKER_OF_DARK_LUNG,
  SUNDERED_PRINCE,
  SUNDERING_STEEL,
  TARR_11,
  THUNDERBERGE,
  TWELVE_QUESTIONS,
  UMBRAL_TORCH,
  VALIANT,
  WAVE_TIDE,
  WEDGE,
];
