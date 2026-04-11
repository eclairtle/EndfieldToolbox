import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import { ATK_TABLE_50_490, ATK_TABLE_51_505, ATK_TABLE_52_510 } from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

export const FORGEBORN_SCATHE: WeaponBase = {
  id: "forgeborn_scathe",
  name: "Forgeborn Scathe",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_52_510,
  tuningMaterials: ["D96 Steel Sample 4 ×16", "Wulingstone ×8"],
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Twilight: Blazing Wail", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      HEAT_DMG_PCT: (12.8 + 3.2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Heat DMG Dealt +${percent(12.8 + 3.2 * y)}.`,
      `When the wielder casts an Ultimate, gain Basic Attack DMG Dealt +${percent(60 + 15 * y)} for 20s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "ULTIMATE_CAST") {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applySelfBuff({
      buffId: "weapon_forgeborn_scathe_basic_attack",
      label: "Forgeborn Scathe",
      durationSeconds: 20,
      effects: {
        BASIC_ATK_DMG_PCT: (60 + 15 * y) / 100,
      },
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const THERMITE_CUTTER: WeaponBase = {
  id: "thermite_cutter",
  name: "Thermite Cutter",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["D96 Steel Sample 4 ×16", "Igneosite ×8"],
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Flow: Thermal Release", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ATK_PCT: (8 + 2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `ATK +${percent(8 + 2 * y)}.`,
      `After the wielder's skill recovers SP or grants a Link state, the entire team gains ATK +${percent(4 + y)} for 20s.`,
      "Max stacks for effects of the same name: 2. Duration of each stack is counted separately.",
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "SKILL_SP_RECOVERED") {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applyTeamBuff({
      buffId: "weapon_thermite_cutter_team_attack",
      label: "Thermite Cutter",
      durationSeconds: 20,
      effects: {
        ATK_PCT: (4 + y) / 100,
      },
      stackGroup: "weapon_thermite_cutter_team_attack",
      maxStacks: 2,
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const KHRAVENGGER: WeaponBase = {
  id: "khravengger",
  name: "Khravengger",
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
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "BATTLE_OR_COMBO_HIT") {
      return;
    }

    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    if (ctx.event.commandAttackType === "BATTLE_SKILL") {
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

    if (ctx.event.commandAttackType === "COMBO_SKILL") {
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
