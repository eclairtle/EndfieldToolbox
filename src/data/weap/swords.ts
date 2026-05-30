import { skillY } from "@/lib/build/weaponSkills";
import type { WeaponBase } from "@/data/weapons";
import { ATK_TABLE_50_490, ATK_TABLE_51_505, ATK_TABLE_52_510 } from "@/data/weap/baseAtkTables";

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function scaledPercentFromRank1(rank1Percent: number, y: number): number {
  return rank1Percent * (0.8 + 0.2 * y);
}

function scaledFlatFromRank1(rank1Value: number, y: number): number {
  return rank1Value * (0.8 + 0.2 * y);
}

export const FORGEBORN_SCATHE: WeaponBase = {
  id: "forgeborn_scathe",
  name: "Forgeborn Scathe",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0006.webp",
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

export const EMINENT_REPUTE: WeaponBase = {
  id: "eminent_repute",
  name: "Eminent Repute",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0013.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_50_490,
  tuningMaterials: ["Tachyon Screening Lattice ×16", "Wulingstone ×8"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Physical DMG Boost [L]", rank: 1, implemented: true },
    { id: "UNIQUE", name: "Brutality: Disciplinarian", rank: 1, implemented: false },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      PHYSICAL_DMG_PCT: scaledPercentFromRank1(5.6, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Physical DMG Dealt +${percent(scaledPercentFromRank1(5.6, y))}.`,
      `ATK +${percent(scaledPercentFromRank1(10, y))}.`,
      "After the wielder consumes Vulnerability stack(s), the wielder gains ATK and other operators in the team gain half of this buff for 20s.",
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
};

export const WHITE_NIGHT_NOVA: WeaponBase = {
  id: "white_night_nova",
  name: "White Night Nova",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0014.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Quadrant Fitting Fluid ×16", "Igneosite ×8"],
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: White Night Nova", rank: 1, implemented: false },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ARTS_DMG_PCT: scaledPercentFromRank1(12, y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `Arts DMG Dealt +${percent(scaledPercentFromRank1(12, y))}.`,
      `After the wielder applies Combustion or Electrification, gain Arts DMG Dealt +${percent(scaledPercentFromRank1(12, y))} and Arts Intensity +${(25 * (0.8 + 0.2 * y)).toFixed(1)} for 15s.`,
      "Effects of the same name cannot stack.",
    ].join("\n");
  },
};

export const THERMITE_CUTTER: WeaponBase = {
  id: "thermite_cutter",
  name: "Thermite Cutter",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0012.webp",
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
    if (
      sourceSlot !== ctx.wearer.slot
      || (ctx.event.type !== "SKILL_SP_RECOVERED" && ctx.event.type !== "TEAM_LINK_GAINED")
    ) {
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

export const LUPINE_SCARLET: WeaponBase = {
  id: "lupine_scarlet",
  name: "Lupine Scarlet",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0022.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["Triphasic Nanoflake ×16", "Igneosite ×8"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "CRIT_UP", name: "Critical Rate Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Fracture: Gnashing Wolves", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ATK_PCT: (12.8 + 3.2 * y) / 100,
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return [
      `ATK +${percent(12.8 + 3.2 * y)}.`,
      `After the wielder's skill deals Critical DMG, gain 1 stack of Wolven Blood for 20s: Physical DMG Dealt and Heat DMG Dealt +${percent(0.8 + 0.2 * y)}.`,
      "Wolven Blood max stacks: 16.",
      `After reaching 16 stacks, gain another Physical DMG Dealt and Heat DMG Dealt +${percent(19.2 + 4.8 * y)} for 20s.`,
    ].join("\n");
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot || ctx.event.type !== "CRIT_THRESHOLD_REACHED") {
      return;
    }
    if (ctx.event.commandAttackType !== "BATTLE_SKILL" && ctx.event.commandAttackType !== "COMBO_SKILL" && ctx.event.commandAttackType !== "ULTIMATE") {
      return;
    }
    const y = skillY(ctx.wearer.weaponSkillLevels[2] ?? 1);
    const critCount = Math.max(0, Math.floor(ctx.event.amount ?? 0));
    if (critCount <= 0) {
      return;
    }
    const beforeStacks = ctx.helpers.getSelfBuffStackCount("weapon_lupine_scarlet_wolven_blood");

    for (let i = 0; i < critCount; i += 1) {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_lupine_scarlet_wolven_blood",
        label: "Lupine Scarlet",
        durationSeconds: 20,
        effects: {
          PHYSICAL_DMG_PCT: (1 + 0.2 * y) / 100,
          HEAT_DMG_PCT: (1 + 0.2 * y) / 100,
        },
        stackGroup: "weapon_lupine_scarlet_wolven_blood",
        maxStacks: 16,
        refreshExistingStacks: false,
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }

    const afterStacks = ctx.helpers.getSelfBuffStackCount("weapon_lupine_scarlet_wolven_blood");
    if (afterStacks >= 16) {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_lupine_scarlet_wolven_frenzy",
        label: "Lupine Scarlet",
        durationSeconds: 20,
        effects: {
          PHYSICAL_DMG_PCT: (24 + 4.8 * y) / 100,
          HEAT_DMG_PCT: (24 + 4.8 * y) / 100,
        },
        eventType: "WEAPON_BUFF_APPLIED",
      });
    }
  },
};

const GRAND_VISION_UNIQUE_DESCRIPTIONS = [
  "Arts Intensity +30.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +36.0%.\nEffects of the same name cannot stack.",
  "Arts Intensity +36.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +43.2%.\nEffects of the same name cannot stack.",
  "Arts Intensity +42.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +50.4%.\nEffects of the same name cannot stack.",
  "Arts Intensity +48.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +57.6%.\nEffects of the same name cannot stack.",
  "Arts Intensity +54.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +64.8%.\nEffects of the same name cannot stack.",
  "Arts Intensity +60.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +72.0%.\nEffects of the same name cannot stack.",
  "Arts Intensity +66.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +79.2%.\nEffects of the same name cannot stack.",
  "Arts Intensity +72.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +86.4%.\nEffects of the same name cannot stack.",
  "Arts Intensity +78.\nWhen the wielder applies Originium Crystals or Solidification, during the next battle skill or ultimate cast within 20s, the wielder gains Physical DMG Dealt +93.6%.\nEffects of the same name cannot stack.",
] as const;

export const GRAND_VISION: WeaponBase = {
  id: "grand_vision",
  name: "Grand Vision",
  rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0021.webp",
  weaponType: "SWORD",
  baseAtkTable: ATK_TABLE_51_505,
  tuningMaterials: ["item_weapon_break_high ×30", "item_char_skill_specialize_1 ×16"],
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Infliction: Long Time Wish", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (uniqueSkillLevel) => {
    const y = skillY(uniqueSkillLevel);
    return {
      ARTS_INTENSITY: scaledFlatFromRank1(30, y),
    };
  },
  getUniqueSkillDescription: (uniqueSkillLevel) => {
    const index = Math.max(0, Math.min(GRAND_VISION_UNIQUE_DESCRIPTIONS.length - 1, uniqueSkillLevel - 1));
    return GRAND_VISION_UNIQUE_DESCRIPTIONS[index] ?? null;
  },
  onCombatEvent: (ctx) => {
    const sourceSlot = ctx.event.sourceSlot ?? ctx.event.slot;
    if (sourceSlot !== ctx.wearer.slot) {
      return;
    }

    const level = ctx.wearer.weaponSkillLevels[2] ?? 1;
    const y = skillY(level);
    const triggerLabel = ctx.event.label ?? "";
    const isSolidificationTrigger =
      ctx.event.type === "ARTS_REACTION_APPLIED"
      && triggerLabel.includes("Solidification Applied");
    const isOriginiumTrigger =
      ctx.event.type === "ENEMY_DEBUFF_APPLIED"
      && triggerLabel === "Originium Crystal";

    if (isSolidificationTrigger || isOriginiumTrigger) {
      ctx.helpers.applySelfBuff({
        buffId: "weapon_grand_vision_long_wish",
        label: "Long Wish",
        durationSeconds: 20,
        timeScale: "game",
        effects: {},
        stackGroup: "weapon_grand_vision_long_wish",
        maxStacks: 1,
        refreshExistingStacks: true,
        eventType: "WEAPON_BUFF_APPLIED",
      });
      return;
    }

    if (ctx.event.type === "BATTLE_SKILL_END" || ctx.event.type === "ULTIMATE_END") {
      ctx.helpers.removeSelfBuff("weapon_grand_vision_physical_boost");
      return;
    }

    const isCast = ctx.event.type === "BATTLE_SKILL_CAST" || ctx.event.type === "ULTIMATE_CAST";
    if (!isCast || ctx.helpers.getSelfBuffStackCount("weapon_grand_vision_long_wish") <= 0) {
      return;
    }

    ctx.helpers.removeSelfBuff("weapon_grand_vision_long_wish");
    ctx.helpers.applySelfBuff({
      buffId: "weapon_grand_vision_physical_boost",
      label: "Grand Vision",
      durationSeconds: 120,
      timeScale: "game",
      effects: {
        PHYSICAL_DMG_PCT: scaledPercentFromRank1(36, y) / 100,
      },
      stackGroup: "weapon_grand_vision_physical_boost",
      maxStacks: 1,
      refreshExistingStacks: true,
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};
