import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import { ATK_TABLE_50_495, ATK_TABLE_51_500, ATK_TABLE_51_505 } from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scaledPercentFromRank1(rank1Percent: number, y: number): number {
  return rank1Percent * (0.8 + 0.2 * y);
}

export const FORMER_FINERY: WeaponBase = {
  id: "former_finery",
  name: "Former Finery",
  rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0006.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_50_495,
  tuningMaterials: ["Metadiastima Photoemission Tube ×16", "Wulingstone ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "HP Boost [L]", rank: 1, implemented: true },
    { id: "UNIQUE", name: "Efficacy: Mincing Therapy", rank: 1, implemented: false },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      HP_PCT: scaledPercentFromRank1(10, y) / 100,
      HEALING_PCT: scaledPercentFromRank1(10, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Max HP +${percent(scaledPercentFromRank1(10, y))}.`,
      `Treatment Efficiency +${percent(scaledPercentFromRank1(10, y))}.`,
      `After a Protected operator takes DMG, the wielder restores HP by [${(84 * (0.8 + 0.2 * y)).toFixed(0)} + Will × ${((0.8 + 0.2 * y)).toFixed(1)}].`,
      "Effect only triggers once every 15s.",
    ].join("\n");
  },
};

export const KHRAVENGGER: WeaponBase = {
  id: "khravengger",
  name: "Khravengger",
  rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0013.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Triphasic Nanoflake ×16", "Wulingstone ×8"],
  skills: [
    { id: "STR_UP", name: "Strength Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Detonate: Bonechilling", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      SKILL_DMG_PCT: (16 + 4 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Skill DMG Dealt +${percent(16 + 4 * y)}.`,
      `When the wielder's battle skill applies Cryo Infliction, gain Cryo DMG Dealt +${percent(8 + 2 * y)} for 15s.`,
      `When the wielder deals combo skill DMG to an enemy with Cryo Infliction, gain Cryo DMG Dealt +${percent(16 + 4 * y)} for 15s.`,
      "The two effects apply separately and do not stack with themselves.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot) {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    if (
      ctx.event.type === "ARTS_INFLICTION_APPLIED"
      && ctx.event.consumedElement === "Cryo"
      && ctx.event.commandAttackType === "BATTLE_SKILL"
    ) {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_khravengger_battle_skill_cryo_damage",
        label: "Khravengger",
        durationSeconds: 15,
        effects: {
          CRYO_DMG_PCT: (8 + 2 * y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
      return;
    }

    if (ctx.event.type === "COMBO_SKILL_HIT") {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_khravengger_combo_skill_cryo_damage",
        label: "Khravengger",
        durationSeconds: 15,
        effects: {
          CRYO_DMG_PCT: (16 + 4 * y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }
  },
};

export const EXEMPLAR: WeaponBase = {
  id: "exemplar",
  name: "Exemplar",
  rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0004.webp",
  weaponType: "GREATSWORD",
  baseAtkTable: ATK_TABLE_51_500,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_5 ×16"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Stacked Hew", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      PHYSICAL_DMG_PCT: (8 + 2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Physical DMG Dealt +${percent(8 + 2 * y)}.`,
      `When the wielder's battle skill or ultimate hits the enemy, the wielder gains Physical DMG Dealt +${percent(8 + 2 * y)} for 30s.`,
      "Max stacks for effects of the same name: 3. Duration of each stack is counted separately. Effect only triggers once every 0.1s.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (
      sourceSlot !== ctx.wearer.slot
      || (ctx.event.type !== "BATTLE_SKILL_HIT" && ctx.event.type !== "ULTIMATE_HIT")
    ) {
      return;
    }

    if (
      !ctx.helpers.tryActivateCooldown({
        key: `exemplar_stacked_hew_cd:${ctx.wearer.slot}`,
        durationSeconds: 0.1,
        timeScale: "real",
      })
    ) {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applySelfBuff({
      buffId: "weapon_exemplar_stacked_hew",
      label: "Exemplar",
      durationSeconds: 30,
      effects: {
        PHYSICAL_DMG_PCT: (8 + 2 * y) / 100,
      },
      stackGroup: "weapon_exemplar_stacked_hew",
      maxStacks: 3,
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};
