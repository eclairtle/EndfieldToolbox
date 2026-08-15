import type { WeaponBase } from "@/data/weapons";
import {
  ATK_TABLE_49_485,
  ATK_TABLE_50_490,
  ATK_TABLE_51_500,
  ATK_TABLE_51_505,
  ATK_TABLE_52_510,
} from "@/data/weap/baseAtkTables";
import { skillY } from "@/lib/build/weaponSkills";

const scale = (rank1: number, level: number) => rank1 * (0.8 + 0.2 * skillY(level));
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const sourceIsWearer = (ctx: Parameters<NonNullable<WeaponBase["onCombatEvent"]>>[0]) =>
  (ctx.event.sourceSlot ?? ctx.event.slot) === ctx.wearer.slot;

export const PHANTOM_PAIN: WeaponBase = {
  id: "phantom_pain", name: "Phantom Pain", rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0016.webp", weaponType: "GREATSWORD", baseAtkTable: ATK_TABLE_50_490,
  skills: [
    { id: "STR_UP", name: "Strength Boost [L]", rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Suppression: Layered Suffering", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (level) => ({ PHYSICAL_DMG_PCT: scale(0.07, level) }),
  getUniqueSkillDescription: (level) => `Physical DMG Dealt +${pct(scale(0.07, level))}.\nCasting a battle or combo skill grants Physical DMG Dealt +${pct(scale(0.055, level))} for 20s, up to 3 independently timed stacks.`,
  combatEventTypes: ["BATTLE_SKILL_CAST", "COMBO_SKILL_CAST"],
  onCombatEvent: (ctx) => {
    if (!sourceIsWearer(ctx)) return;
    ctx.helpers.applySelfBuff({
      buffId: "weapon_phantom_pain_physical", label: "Layered Suffering", durationSeconds: 20,
      effects: { PHYSICAL_DMG_PCT: scale(0.055, ctx.wearer.weaponSkillLevels[2] ?? 1) },
      stackGroup: "weapon_phantom_pain_physical", maxStacks: 3, refreshExistingStacks: false,
      eventType: "WEAPON_BUFF_APPLIED",
    });
  },
};

export const BEACON_OF_DUTY: WeaponBase = {
  id: "beacon_of_duty", name: "Beacon of Duty", rarity: 6,
  imagePath: "/weapons/lance/wpn_lance_0007.webp", weaponType: "POLEARM", baseAtkTable: ATK_TABLE_49_485,
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "ULT_GAIN_UP", name: "Ultimate Gain Efficiency Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Efficacy: Fuel for the Torch", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (level) => ({ HEAT_DMG_PCT: scale(0.07, level) }),
  getUniqueSkillDescription: (level) => `Heat DMG Dealt +${pct(scale(0.07, level))}.\nApplying Heat Infliction with the wielder's skill grants Physical and Heat DMG Dealt +${pct(scale(0.08, level))} for 20s.`,
  combatEventTypes: ["ARTS_INFLICTION_APPLIED"],
  onCombatEvent: (ctx) => {
    if (!sourceIsWearer(ctx) || ctx.event.consumedElement !== "Heat") return;
    const value = scale(0.08, ctx.wearer.weaponSkillLevels[2] ?? 1);
    ctx.helpers.applySelfBuff({ buffId: "weapon_beacon_of_duty_heat_infliction", label: "Fuel for the Torch", durationSeconds: 20, effects: { PHYSICAL_DMG_PCT: value, HEAT_DMG_PCT: value }, eventType: "WEAPON_BUFF_APPLIED" });
  },
};

export const AMARANTHINE_TASSEL: WeaponBase = {
  id: "amaranthine_tassel", name: "Amaranthine Tassel", rarity: 6,
  imagePath: "/weapons/claym/wpn_claym_0017.webp", weaponType: "GREATSWORD", baseAtkTable: ATK_TABLE_52_510,
  skills: [
    { id: "STR_UP", name: "Strength Boost [L]", rank: 3, implemented: true },
    { id: "ATK_UP", name: "Attack Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Combative: Amaranthine Cleave", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (level) => ({ PHYSICAL_DMG_PCT: scale(0.16, level) }),
  getUniqueSkillDescription: (level) => `Physical DMG Dealt +${pct(scale(0.16, level))}.\nApplying Physical Susceptibility grants Arts Intensity +${Math.round(scale(30, level))} for 20s. Crush grants additional Physical DMG based on consumed Vulnerability stacks.`,
  combatEventTypes: ["PHYSICAL_REACTION_APPLIED"],
  onCombatEvent: (ctx) => {
    if (!sourceIsWearer(ctx)) return;
    const y = ctx.wearer.weaponSkillLevels[2] ?? 1;
    if (ctx.event.label.toLowerCase().includes("breach")) {
      ctx.helpers.applySelfBuff({ buffId: "weapon_amaranthine_tassel_intensity", label: "Amaranthine Cleave", durationSeconds: 20, effects: { ARTS_INTENSITY: scale(30, y) }, eventType: "WEAPON_BUFF_APPLIED" });
    }
    if (ctx.event.label.toLowerCase().includes("crush")) {
      const stacks = Math.max(0, ctx.event.consumedStacks ?? ctx.event.amount ?? 0);
      ctx.helpers.applySelfBuff({ buffId: "weapon_amaranthine_tassel_crush", label: "Amaranthine Cleave: Crush", durationSeconds: 30, effects: { PHYSICAL_DMG_PCT: scale(0.09, y) + scale(0.03, y) * stacks }, eventType: "WEAPON_BUFF_APPLIED" });
    }
  },
};

export const TYPE_42_SOLEMN_PHALANX: WeaponBase = {
  id: "type_42_solemn_phalanx", name: "Type 42: Solemn Phalanx", rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0016.webp", weaponType: "ARTS_UNIT", baseAtkTable: ATK_TABLE_51_505,
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "ULT_GAIN_UP", name: "Ultimate Gain Efficiency Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Detonate: Debilitating Assault", rank: 1, implemented: false },
  ],
  getUniqueStaticModifiers: (level) => ({ ATK_PCT: scale(0.16, level) }),
  getUniqueSkillDescription: (level) => `ATK +${pct(scale(0.16, level))}. Conditional effects compare the wielder's pre-combat Intellect and Will; this branch is not yet simulated.`,
};

export const JUNCTION_POINT: WeaponBase = {
  id: "junction_point", name: "Junction Point", rarity: 6,
  imagePath: "/weapons/funnel/wpn_funnel_0018.webp", weaponType: "ARTS_UNIT", baseAtkTable: ATK_TABLE_50_490,
  skills: [
    { id: "INT_UP", name: "Intellect Boost [L]", rank: 3, implemented: true },
    { id: "ULT_GAIN_UP", name: "Ultimate Gain Efficiency Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Efficacy: Feedback Loop", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (level) => ({ NATURE_DMG_PCT: scale(0.07, level) }),
  getUniqueSkillDescription: (level) => `Nature DMG Dealt +${pct(scale(0.07, level))}.\nA combo skill applying Arts Infliction or Arts Susceptibility grants the wielder ATK +${pct(scale(0.06, level))} and other operators ATK +${pct(scale(0.015, level))} for 20s, up to 2 stacks.`,
  combatEventTypes: ["ARTS_INFLICTION_APPLIED", "ARTS_REACTION_APPLIED"],
  onCombatEvent: (ctx) => {
    if (!sourceIsWearer(ctx) || ctx.event.commandAttackType !== "COMBO_SKILL") return;
    const y = ctx.wearer.weaponSkillLevels[2] ?? 1;
    ctx.helpers.applySelfBuff({ buffId: "weapon_junction_point_self", label: "Feedback Loop", durationSeconds: 20, effects: { ATK_PCT: scale(0.06, y) }, stackGroup: "weapon_junction_point_self", maxStacks: 2, refreshExistingStacks: false, eventType: "WEAPON_BUFF_APPLIED" });
    ctx.helpers.applyTeamBuffFiltered({ buffId: "weapon_junction_point_team", label: "Feedback Loop", durationSeconds: 20, effects: { ATK_PCT: scale(0.015, y) }, shouldApplyTo: (target) => target.slot !== ctx.wearer.slot, stackGroup: "weapon_junction_point_team", maxStacks: 2, refreshExistingStacks: false, eventType: "WEAPON_BUFF_APPLIED" });
  },
};

export const BEDAZZLING_NIGHT_DEBUT: WeaponBase = {
  id: "bedazzling_night_debut", name: "Bedazzling Night Debut", rarity: 6,
  imagePath: "/weapons/lance/wpn_lance_0014.webp", weaponType: "POLEARM", baseAtkTable: ATK_TABLE_51_500,
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "HEALING_UP", name: "Treatment Efficiency Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Medicant: Shimmering Curtain", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (level) => ({ MAIN_ATTR_PCT: scale(0.16, level) }),
  getUniqueSkillDescription: (level) => `Main attribute +${pct(scale(0.16, level))}.\nHealing another operator grants that operator ATK +${pct(scale(0.035, level))} for 20s, up to 4 independently timed stacks.`,
  combatEventTypes: ["HEALING_HIT_EXECUTED"],
  onCombatEvent: (ctx) => {
    if (!sourceIsWearer(ctx) || ctx.event.slot == null || ctx.event.slot === ctx.wearer.slot) return;
    const targetSlot = ctx.event.slot;
    ctx.helpers.applyTeamBuffFiltered({ buffId: "weapon_bedazzling_night_debut_attack", label: "Shimmering Curtain", durationSeconds: 20, effects: { ATK_PCT: scale(0.035, ctx.wearer.weaponSkillLevels[2] ?? 1) }, shouldApplyTo: (target) => target.slot === targetSlot, stackGroup: "weapon_bedazzling_night_debut_attack", maxStacks: 4, refreshExistingStacks: false, eventType: "WEAPON_BUFF_APPLIED" });
  },
};

export const BLESSING_OF_LUSTROUS_CARMINE: WeaponBase = {
  id: "blessing_of_lustrous_carmine", name: "Blessing of Lustrous Carmine", rarity: 6,
  imagePath: "/weapons/lance/wpn_lance_0015.webp", weaponType: "POLEARM", baseAtkTable: ATK_TABLE_51_500,
  skills: [
    { id: "AGI_UP", name: "Agility Boost [L]", rank: 3, implemented: true },
    { id: "HEAT_DMG_UP", name: "Heat DMG Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Flow: Absolver of Guilt", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (level) => ({ ULT_GAIN_PCT: scale(0.18, level) }),
  getUniqueSkillDescription: (level) => `Ultimate Gain Efficiency +${pct(scale(0.18, level))}.\nRecovering SP grants team ATK +${pct(scale(0.06, level))}; applying Heat Infliction grants team Heat DMG +${pct(scale(0.06, level))}. Both last 20s.`,
  combatEventTypes: ["SKILL_SP_RECOVERED", "ARTS_INFLICTION_APPLIED"],
  onCombatEvent: (ctx) => {
    if (!sourceIsWearer(ctx)) return;
    const value = scale(0.06, ctx.wearer.weaponSkillLevels[2] ?? 1);
    if (ctx.event.type === "SKILL_SP_RECOVERED") ctx.helpers.applyTeamBuff({ buffId: "weapon_blessing_carmine_attack", label: "Absolver of Guilt", durationSeconds: 20, effects: { ATK_PCT: value }, eventType: "WEAPON_BUFF_APPLIED" });
    if (ctx.event.type === "ARTS_INFLICTION_APPLIED" && ctx.event.consumedElement === "Heat") ctx.helpers.applyTeamBuff({ buffId: "weapon_blessing_carmine_heat", label: "Absolver of Guilt: Heat", durationSeconds: 20, effects: { HEAT_DMG_PCT: value }, eventType: "WEAPON_BUFF_APPLIED" });
  },
};

export const GOLDEN_AGE: WeaponBase = {
  id: "golden_age", name: "Golden Age", rarity: 6,
  imagePath: "/weapons/lance/wpn_lance_0016.webp", weaponType: "POLEARM", baseAtkTable: ATK_TABLE_49_485,
  skills: [
    { id: "WIL_UP", name: "Will Boost [L]", rank: 3, implemented: true },
    { id: "HEALING_UP", name: "Treatment Efficiency Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Pursuit: Great Hero", rank: 1, implemented: true },
  ],
  getUniqueStaticModifiers: (level) => ({ ELECTRIC_DMG_PCT: scale(0.06, level) }),
  getUniqueSkillDescription: (level) => `Electric DMG Dealt +${pct(scale(0.06, level))}.\nWhen the wielder's combo skill deals damage, Treatment Efficiency +${pct(scale(0.04, level))} for 15s.`,
  combatEventTypes: ["COMBO_SKILL_HIT"],
  onCombatEvent: (ctx) => {
    if (!sourceIsWearer(ctx)) return;
    ctx.helpers.applySelfBuff({ buffId: "weapon_golden_age_healing", label: "Great Hero", durationSeconds: 15, effects: { HEALING_PCT: scale(0.04, ctx.wearer.weaponSkillLevels[2] ?? 1) }, eventType: "WEAPON_BUFF_APPLIED" });
  },
};

export const FARSIGHT: WeaponBase = {
  id: "farsight", name: "Farsight", rarity: 6,
  imagePath: "/weapons/sword/wpn_sword_0026.webp", weaponType: "SWORD", baseAtkTable: ATK_TABLE_51_500,
  skills: [
    { id: "MAIN_ATTR_UP", name: "Main Attribute Boost [L]", rank: 3, implemented: true },
    { id: "ARTS_INTENSITY_UP", name: "Arts Intensity Boost [L]", rank: 3, implemented: true },
    { id: "UNIQUE", name: "Assault: Vision for Tomorrow", rank: 1, implemented: true },
  ],
  getUniqueSkillDescription: (level) => `When entering battle, the entire team gains DMG Dealt +${pct(scale(0.05, level))}, Arts Intensity +${Math.round(scale(10, level))}, and DEF +${pct(scale(0.03, level))} for 20s. The ending heal is not yet simulated.`,
  combatEventTypes: ["COMBAT_INITIALIZED"],
  onCombatEvent: (ctx) => {
    const y = ctx.wearer.weaponSkillLevels[2] ?? 1;
    ctx.helpers.applyTeamBuff({ buffId: "weapon_farsight_dream_striving", label: "Dream Striving", durationSeconds: 20, effects: { ALL_DMG_PCT: scale(0.05, y), ARTS_INTENSITY: scale(10, y) }, eventType: "WEAPON_BUFF_APPLIED" });
  },
};

export const VERSION_14_WEAPONS: WeaponBase[] = [
  BEACON_OF_DUTY, PHANTOM_PAIN, AMARANTHINE_TASSEL, TYPE_42_SOLEMN_PHALANX,
  JUNCTION_POINT, BEDAZZLING_NIGHT_DEBUT, BLESSING_OF_LUSTROUS_CARMINE, GOLDEN_AGE, FARSIGHT,
];
